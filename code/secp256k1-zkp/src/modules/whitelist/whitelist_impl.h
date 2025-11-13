/**********************************************************************
 * Copyright (c) 2016 Andrew Poelstra                                 *
 * Distributed under the MIT software license, see the accompanying   *
 * file COPYING or http://www.opensource.org/licenses/mit-license.php.*
 **********************************************************************/

#ifndef SECP256K1_WHITELIST_IMPL_H
#define SECP256K1_WHITELIST_IMPL_H

static int secp256k1_whitelist_hash_pubkey(secp256k1_scalar* output, secp256k1_gej* pubkey) {
    unsigned char h[32];
    unsigned char c[33];
    secp256k1_sha256 sha;
    int overflow = 0;
    size_t size = 33;
    secp256k1_ge ge;

    secp256k1_ge_set_gej(&ge, pubkey);

    secp256k1_sha256_initialize(&sha);
    if (!secp256k1_eckey_pubkey_serialize(&ge, c, &size, SECP256K1_EC_COMPRESSED)) {
        return 0;
    }
    secp256k1_sha256_write(&sha, c, size);
    secp256k1_sha256_finalize(&sha, h);

    secp256k1_scalar_set_b32(output, h, &overflow);
    if (overflow || secp256k1_scalar_is_zero(output)) {
        /* This return path is mathematically impossible to hit */
        secp256k1_scalar_clear(output);
        return 0;
    }
    return 1;
}

static int secp256k1_whitelist_tweak_pubkey(secp256k1_gej* pub_tweaked) {
    secp256k1_scalar tweak;
    secp256k1_scalar zero;
    int ret;

    secp256k1_scalar_set_int(&zero, 0);

    ret = secp256k1_whitelist_hash_pubkey(&tweak, pub_tweaked);
    if (ret) {
        secp256k1_ecmult(pub_tweaked, pub_tweaked, &tweak, &zero);
    }
    return ret;
}

static int secp256k1_whitelist_compute_tweaked_privkey(const secp256k1_context* ctx, secp256k1_scalar* skey, const unsigned char *online_key, const unsigned char *summed_key) {
    secp256k1_scalar tweak;
    int ret = 1;
    int overflow = 0;

    secp256k1_scalar_set_b32(skey, summed_key, &overflow);
    if (overflow || secp256k1_scalar_is_zero(skey)) {
        ret = 0;
    }
    if (ret) {
        secp256k1_gej pkeyj;
        secp256k1_ecmult_gen(&ctx->ecmult_gen_ctx, &pkeyj, skey);
        ret = secp256k1_whitelist_hash_pubkey(&tweak, &pkeyj);
    }
    if (ret) {
        secp256k1_scalar sonline;
        secp256k1_scalar_mul(skey, skey, &tweak);

        secp256k1_scalar_set_b32(&sonline, online_key, &overflow);
        if (overflow || secp256k1_scalar_is_zero(&sonline)) {
            ret = 0;
        }
        secp256k1_scalar_add(skey, skey, &sonline);
        secp256k1_scalar_clear(&sonline);
        secp256k1_scalar_clear(&tweak);
    }

    if (!ret) {
        secp256k1_scalar_clear(skey);
    }
    return ret;
}

/* Takes a list of pubkeys and combines them to form the public keys needed
 * for the ring signature; also produce a commitment to every one that will
 * be our "message". */
static int secp256k1_whitelist_compute_keys_and_message(const secp256k1_context* ctx, unsigned char *msg32, secp256k1_gej *keys, const secp256k1_pubkey *online_pubkeys, const secp256k1_pubkey *offline_pubkeys, const int n_keys, const secp256k1_pubkey *sub_pubkey) {
    unsigned char c[33];
    size_t size = 33;
    secp256k1_sha256 sha;
    int i;
    secp256k1_ge subkey_ge;

    secp256k1_sha256_initialize(&sha);
    secp256k1_pubkey_load(ctx, &subkey_ge, sub_pubkey);

    /* commit to sub-key */
    if (!secp256k1_eckey_pubkey_serialize(&subkey_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
        return 0;
    }
    secp256k1_sha256_write(&sha, c, size);
    for (i = 0; i < n_keys; i++) {
        secp256k1_ge offline_ge;
        secp256k1_ge online_ge;
        secp256k1_gej tweaked_gej;

        /* commit to fixed keys */
        secp256k1_pubkey_load(ctx, &offline_ge, &offline_pubkeys[i]);
        if (!secp256k1_eckey_pubkey_serialize(&offline_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
            return 0;
        }
        secp256k1_sha256_write(&sha, c, size);
        secp256k1_pubkey_load(ctx, &online_ge, &online_pubkeys[i]);
        if (!secp256k1_eckey_pubkey_serialize(&online_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
            return 0;
        }
        secp256k1_sha256_write(&sha, c, size);

        /* compute tweaked keys */
        secp256k1_gej_set_ge(&tweaked_gej, &offline_ge);
        secp256k1_gej_add_ge_var(&tweaked_gej, &tweaked_gej, &subkey_ge, NULL);
        secp256k1_whitelist_tweak_pubkey(&tweaked_gej);
        secp256k1_gej_add_ge_var(&keys[i], &tweaked_gej, &online_ge, NULL);
    }
    secp256k1_sha256_finalize(&sha, msg32);
    return 1;
}

/* 新增逻辑，带消息msg的挑战哈希 */
static void write_u64_be(unsigned char out[8], uint64_t x) {
    int i;
    for (i = 7; i >= 0; --i) { out[i] = (unsigned char)(x & 0xFF); x >>= 8; }
}

/* TaggedHash：H(H(tag)||H(tag)||len(msg)||msg) */
static void secp256k1_whitelist_hash_init_with_msg(
    secp256k1_sha256* sha,
    const unsigned char* msg,
    size_t msglen
) {
    /* 域分离标签 */
    static const char* tag = "whitelist-msg-v1";
    unsigned char taghash[32];
    secp256k1_sha256 shatmp;
    unsigned char lenbe[8];

    secp256k1_sha256_initialize(&shatmp);
    secp256k1_sha256_write(&shatmp, (const unsigned char*)tag, strlen(tag));
    secp256k1_sha256_finalize(&shatmp, taghash);

    secp256k1_sha256_initialize(sha);
    secp256k1_sha256_write(sha, taghash, 32);
    secp256k1_sha256_write(sha, taghash, 32);

    write_u64_be(lenbe, (uint64_t)msglen);
    secp256k1_sha256_write(sha, lenbe, 8);
    if (msg && msglen) secp256k1_sha256_write(sha, msg, msglen);
}

static int secp256k1_whitelist_compute_keys_and_message_with_msg(
    const secp256k1_context* ctx,
    unsigned char *msg32,
    secp256k1_gej *keys,
    const secp256k1_pubkey *online_pubkeys,
    const secp256k1_pubkey *offline_pubkeys,
    const int n_keys,
    const secp256k1_pubkey *sub_pubkey,
    const unsigned char* msg, 
    size_t msglen
) {
    unsigned char c[33];
    size_t size = 33;
    secp256k1_sha256 sha;
    int i;
    secp256k1_ge subkey_ge;

    /* 初始化时带上 msg */
    secp256k1_whitelist_hash_init_with_msg(&sha, msg, msglen);

    secp256k1_pubkey_load(ctx, &subkey_ge, sub_pubkey);

    /* commit to sub-key */
    if (!secp256k1_eckey_pubkey_serialize(&subkey_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
        return 0;
    }
    secp256k1_sha256_write(&sha, c, size);

    for (i = 0; i < n_keys; i++) {
        secp256k1_ge offline_ge;
        secp256k1_ge online_ge;
        secp256k1_gej tweaked_gej;

        /* commit to fixed keys */
        secp256k1_pubkey_load(ctx, &offline_ge, &offline_pubkeys[i]);
        if (!secp256k1_eckey_pubkey_serialize(&offline_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
            return 0;
        }
        secp256k1_sha256_write(&sha, c, size);

        secp256k1_pubkey_load(ctx, &online_ge, &online_pubkeys[i]);
        if (!secp256k1_eckey_pubkey_serialize(&online_ge, c, &size, SECP256K1_EC_COMPRESSED)) {
            return 0;
        }
        secp256k1_sha256_write(&sha, c, size);

        /* compute tweaked keys:  offline_i + sub, 再做 whitelist tweak, 然后加 online_i */
        secp256k1_gej_set_ge(&tweaked_gej, &offline_ge);
        secp256k1_gej_add_ge_var(&tweaked_gej, &tweaked_gej, &subkey_ge, NULL);
        secp256k1_whitelist_tweak_pubkey(&tweaked_gej);
        secp256k1_gej_add_ge_var(&keys[i], &tweaked_gej, &online_ge, NULL);
    }
    secp256k1_sha256_finalize(&sha, msg32);
    return 1;
}


#endif
