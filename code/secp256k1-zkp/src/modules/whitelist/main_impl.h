/**********************************************************************
 * Copyright (c) 2016 Andrew Poelstra                                 *
 * Distributed under the MIT software license, see the accompanying   *
 * file COPYING or http://www.opensource.org/licenses/mit-license.php.*
 **********************************************************************/

#ifndef SECP256K1_MODULE_WHITELIST_MAIN_H
#define SECP256K1_MODULE_WHITELIST_MAIN_H

#include "../../../include/secp256k1_whitelist.h"
#include "whitelist_impl.h"

#define MAX_KEYS SECP256K1_WHITELIST_MAX_N_KEYS  /* shorter alias */

static void wl_write_u64_be(unsigned char out[8], uint64_t x) {
    int i;
    for (i = 7; i >= 0; --i) { out[i] = (unsigned char)(x & 0xFF); x >>= 8; }
}

/* TaggedHash：H(H(tag)||H(tag)||len(msg)||msg) */
static void wl_hash_init_with_msg(
    secp256k1_sha256* sha,
    const unsigned char* msg,
    size_t msglen
) {
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


    wl_write_u64_be(lenbe, (uint64_t)msglen);
    secp256k1_sha256_write(sha, lenbe, 8);
    if (msg && msglen) secp256k1_sha256_write(sha, msg, msglen);
}

int secp256k1_whitelist_sign(const secp256k1_context* ctx, secp256k1_whitelist_signature *sig, const secp256k1_pubkey *online_pubkeys, const secp256k1_pubkey *offline_pubkeys, const size_t n_keys, const secp256k1_pubkey *sub_pubkey, const unsigned char *online_seckey, const unsigned char *summed_seckey, const size_t index) {
    secp256k1_gej pubs[MAX_KEYS];
    secp256k1_scalar s[MAX_KEYS];
    secp256k1_scalar sec, non;
    unsigned char msg32[32];
    int ret;

    /* Sanity checks */
    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(secp256k1_ecmult_gen_context_is_built(&ctx->ecmult_gen_ctx));
    ARG_CHECK(sig != NULL);
    ARG_CHECK(online_pubkeys != NULL);
    ARG_CHECK(offline_pubkeys != NULL);
    ARG_CHECK(n_keys <= MAX_KEYS);
    ARG_CHECK(sub_pubkey != NULL);
    ARG_CHECK(online_seckey != NULL);
    ARG_CHECK(summed_seckey != NULL);
    ARG_CHECK(index < n_keys);

    /* Compute pubkeys: online_pubkey + tweaked(offline_pubkey + address), and message */
    ret = secp256k1_whitelist_compute_keys_and_message(ctx, msg32, pubs, online_pubkeys, offline_pubkeys, n_keys, sub_pubkey);

    /* Compute signing key: online_seckey + tweaked(summed_seckey) */
    if (ret) {
        ret = secp256k1_whitelist_compute_tweaked_privkey(ctx, &sec, online_seckey, summed_seckey);
    }
    /* Compute nonce and random s-values */
    if (ret) {
        unsigned char seckey32[32];
        unsigned int count = 0;
        int overflow = 0;

        secp256k1_scalar_get_b32(seckey32, &sec);
        while (1) {
            size_t i;
            unsigned char nonce32[32];
            int done;
            ret = secp256k1_nonce_function_default(nonce32, msg32, seckey32, NULL, NULL, count);
            if (!ret) {
                break;
            }
            secp256k1_scalar_set_b32(&non, nonce32, &overflow);
            memset(nonce32, 0, 32);
            if (overflow || secp256k1_scalar_is_zero(&non)) {
                count++;
                continue;
            }
            done = 1;
            for (i = 0; i < n_keys; i++) {
                msg32[0] ^= i + 1;
                msg32[1] ^= (i + 1) / 0x100;
                ret = secp256k1_nonce_function_default(&sig->data[32 * (i + 1)], msg32, seckey32, NULL, NULL, count);
                if (!ret) {
                    break;
                }
                secp256k1_scalar_set_b32(&s[i], &sig->data[32 * (i + 1)], &overflow);
                msg32[0] ^= i + 1;
                msg32[1] ^= (i + 1) / 0x100;
                if (overflow || secp256k1_scalar_is_zero(&s[i])) {
                    count++;
                    done = 0;
                    break;
                }
            }
            if (done) {
                break;
            }
        }
        memset(seckey32, 0, 32);
    }
    /* Actually sign */
    if (ret) {
        sig->n_keys = n_keys;
        ret = secp256k1_borromean_sign(&ctx->ecmult_gen_ctx, &sig->data[0], s, pubs, &non, &sec, &n_keys, &index, 1, msg32, 32);
        /* Signing will change s[index], so update in the sig structure */
        secp256k1_scalar_get_b32(&sig->data[32 * (index + 1)], &s[index]);
    }

    secp256k1_scalar_clear(&non);
    secp256k1_scalar_clear(&sec);
    return ret;
}
 
/* 新增with_msg版本 */
int secp256k1_whitelist_sign_msg(const secp256k1_context* ctx, secp256k1_whitelist_signature *sig, const secp256k1_pubkey *online_pubkeys, const secp256k1_pubkey *offline_pubkeys, const size_t n_keys, const secp256k1_pubkey *sub_pubkey, const unsigned char *online_seckey, const unsigned char *summed_seckey, const size_t index, const unsigned char *msg, size_t msglen) {
    secp256k1_gej pubs[MAX_KEYS];
    secp256k1_scalar s[MAX_KEYS];
    secp256k1_scalar sec, non;
    unsigned char msg32[32];
    int ret;

    /* Sanity checks */
    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(secp256k1_ecmult_gen_context_is_built(&ctx->ecmult_gen_ctx));
    ARG_CHECK(sig != NULL);
    ARG_CHECK(online_pubkeys != NULL);
    ARG_CHECK(offline_pubkeys != NULL);
    ARG_CHECK(n_keys <= MAX_KEYS);
    ARG_CHECK(sub_pubkey != NULL);
    ARG_CHECK(online_seckey != NULL);
    ARG_CHECK(summed_seckey != NULL);
    ARG_CHECK(index < n_keys);

    /* 修改部分 */
    ret = secp256k1_whitelist_compute_keys_and_message_with_msg(ctx, msg32, pubs, online_pubkeys, offline_pubkeys, n_keys, sub_pubkey, msg, msglen);

    /* Compute signing key: online_seckey + tweaked(summed_seckey) */
    if (ret) {
        ret = secp256k1_whitelist_compute_tweaked_privkey(ctx, &sec, online_seckey, summed_seckey);
    }
    /* Compute nonce and random s-values */
    if (ret) {
        unsigned char seckey32[32];
        unsigned int count = 0;
        int overflow = 0;

        secp256k1_scalar_get_b32(seckey32, &sec);
        while (1) {
            size_t i;
            unsigned char nonce32[32];
            int done;
            ret = secp256k1_nonce_function_default(nonce32, msg32, seckey32, NULL, NULL, count);
            if (!ret) {
                break;
            }
            secp256k1_scalar_set_b32(&non, nonce32, &overflow);
            memset(nonce32, 0, 32);
            if (overflow || secp256k1_scalar_is_zero(&non)) {
                count++;
                continue;
            }
            done = 1;
            for (i = 0; i < n_keys; i++) {
                msg32[0] ^= i + 1;
                msg32[1] ^= (i + 1) / 0x100;
                ret = secp256k1_nonce_function_default(&sig->data[32 * (i + 1)], msg32, seckey32, NULL, NULL, count);
                if (!ret) {
                    break;
                }
                secp256k1_scalar_set_b32(&s[i], &sig->data[32 * (i + 1)], &overflow);
                msg32[0] ^= i + 1;
                msg32[1] ^= (i + 1) / 0x100;
                if (overflow || secp256k1_scalar_is_zero(&s[i])) {
                    count++;
                    done = 0;
                    break;
                }
            }
            if (done) {
                break;
            }
        }
        memset(seckey32, 0, 32);
    }
    /* Actually sign */
    if (ret) {
        sig->n_keys = n_keys;
        ret = secp256k1_borromean_sign(&ctx->ecmult_gen_ctx, &sig->data[0], s, pubs, &non, &sec, &n_keys, &index, 1, msg32, 32);
        /* Signing will change s[index], so update in the sig structure */
        secp256k1_scalar_get_b32(&sig->data[32 * (index + 1)], &s[index]);
    }

    secp256k1_scalar_clear(&non);
    secp256k1_scalar_clear(&sec);
    return ret;
}

int secp256k1_whitelist_verify(const secp256k1_context* ctx, const secp256k1_whitelist_signature *sig, const secp256k1_pubkey *online_pubkeys, const secp256k1_pubkey *offline_pubkeys, const size_t n_keys, const secp256k1_pubkey *sub_pubkey) {
    secp256k1_scalar s[MAX_KEYS];
    secp256k1_gej pubs[MAX_KEYS];
    unsigned char msg32[32];
    size_t i;

    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(sig != NULL);
    ARG_CHECK(online_pubkeys != NULL);
    ARG_CHECK(offline_pubkeys != NULL);
    ARG_CHECK(sub_pubkey != NULL);

    if (sig->n_keys > MAX_KEYS || sig->n_keys != n_keys) {
        return 0;
    }
    for (i = 0; i < sig->n_keys; i++) {
        int overflow = 0;
        secp256k1_scalar_set_b32(&s[i], &sig->data[32 * (i + 1)], &overflow);
        if (overflow || secp256k1_scalar_is_zero(&s[i])) {
            return 0;
        }
    }

    /* Compute pubkeys: online_pubkey + tweaked(offline_pubkey + address), and message */
    if (!secp256k1_whitelist_compute_keys_and_message(ctx, msg32, pubs, online_pubkeys, offline_pubkeys, sig->n_keys, sub_pubkey)) {
        return 0;
    }
    /* Do verification */
    return secp256k1_borromean_verify(NULL, &sig->data[0], s, pubs, &sig->n_keys, 1, msg32, 32);
}

/* 新增with_msg版本 */
int secp256k1_whitelist_verify_msg(const secp256k1_context* ctx, const secp256k1_whitelist_signature *sig, const secp256k1_pubkey *online_pubkeys, const secp256k1_pubkey *offline_pubkeys, const size_t n_keys, const secp256k1_pubkey *sub_pubkey, const unsigned char *msg, size_t msglen) {
    secp256k1_scalar s[MAX_KEYS];
    secp256k1_gej pubs[MAX_KEYS];
    unsigned char msg32[32];
    size_t i;

    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(sig != NULL);
    ARG_CHECK(online_pubkeys != NULL);
    ARG_CHECK(offline_pubkeys != NULL);
    ARG_CHECK(sub_pubkey != NULL);

    if (sig->n_keys > MAX_KEYS || sig->n_keys != n_keys) {
        return 0;
    }
    for (i = 0; i < sig->n_keys; i++) {
        int overflow = 0;
        secp256k1_scalar_set_b32(&s[i], &sig->data[32 * (i + 1)], &overflow);
        if (overflow || secp256k1_scalar_is_zero(&s[i])) {
            return 0;
        }
    }

    /* 仅修改为带消息的版本 */
    if (!secp256k1_whitelist_compute_keys_and_message_with_msg(ctx, msg32, pubs, online_pubkeys, offline_pubkeys, sig->n_keys, sub_pubkey, msg, msglen)) {
        return 0;
    }
    /* Do verification */
    return secp256k1_borromean_verify(NULL, &sig->data[0], s, pubs, &sig->n_keys, 1, msg32, 32);
}

size_t secp256k1_whitelist_signature_n_keys(const secp256k1_whitelist_signature *sig) {
    return sig->n_keys;
}

int secp256k1_whitelist_signature_parse(const secp256k1_context* ctx, secp256k1_whitelist_signature *sig, const unsigned char *input, size_t input_len) {
    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(sig != NULL);
    ARG_CHECK(input != NULL);

    if (input_len == 0) {
        return 0;
    }

    sig->n_keys = input[0];
    if (sig->n_keys > MAX_KEYS || input_len != 1 + 32 * (sig->n_keys + 1)) {
        return 0;
    }
    memcpy(&sig->data[0], &input[1], 32 * (sig->n_keys + 1));

    return 1;
}

int secp256k1_whitelist_signature_serialize(const secp256k1_context* ctx, unsigned char *output, size_t *output_len, const secp256k1_whitelist_signature *sig) {
    VERIFY_CHECK(ctx != NULL);
    ARG_CHECK(output != NULL);
    ARG_CHECK(output_len != NULL);
    ARG_CHECK(sig != NULL);

    if (*output_len < 1 + 32 * (sig->n_keys + 1)) {
        return 0;
    }

    output[0] = sig->n_keys;
    memcpy(&output[1], &sig->data[0], 32 * (sig->n_keys + 1));
    *output_len = 1 + 32 * (sig->n_keys + 1);

    return 1;
}

#endif
