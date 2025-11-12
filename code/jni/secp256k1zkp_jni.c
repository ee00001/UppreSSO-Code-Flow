#include <jni.h>
#include <stdlib.h>
#include <string.h>

#include "secp256k1.h"
#include "secp256k1_whitelist.h"


#define CHECK_THROW(env, cond, klass, msg, ret) \
    do { if (!(cond)) { jclass ex = (*env)->FindClass(env, klass); if (ex) (*env)->ThrowNew(env, ex, msg); return ret; } } while(0)

#define REQ_NOT_NULL(env, ptr, name, ret) \
    CHECK_THROW(env, (ptr)!=NULL, "java/lang/NullPointerException", name " is null", ret)

#define MAX_KEYS SECP256K1_WHITELIST_MAX_N_KEYS

static secp256k1_context* g_ctx = NULL;

/* ---------- 工具：解析 [[B] -> pubkey[] ---------- */
static int parse_pubkeys(JNIEnv* env, jobjectArray jkeys33, secp256k1_pubkey* out, size_t* out_n) {
    REQ_NOT_NULL(env, jkeys33, "keys", 0);
    jsize n = (*env)->GetArrayLength(env, jkeys33);
    CHECK_THROW(env, n > 0, "java/lang/IllegalArgumentException", "keys length must be > 0", 0);
    CHECK_THROW(env, n <= MAX_KEYS, "java/lang/IllegalArgumentException", "too many keys", 0);

    for (jsize i = 0; i < n; i++) {
        jbyteArray jpk = (jbyteArray)(*env)->GetObjectArrayElement(env, jkeys33, i);
        REQ_NOT_NULL(env, jpk, "key element", 0);
        jsize len = (*env)->GetArrayLength(env, jpk);
        (*env)->DeleteLocalRef(env, jpk); /* 先删，后面重新取元素值避免局部引用堆积 */
        CHECK_THROW(env, len == 33, "java/lang/IllegalArgumentException", "each pubkey must be 33 bytes", 0);

        /* 重新取 bytes */
        jpk = (jbyteArray)(*env)->GetObjectArrayElement(env, jkeys33, i);
        jboolean isCopy = 0;
        jbyte* pkbytes = (*env)->GetByteArrayElements(env, jpk, &isCopy);
        int ok = secp256k1_ec_pubkey_parse(g_ctx, &out[i], (const unsigned char*)pkbytes, 33);
        (*env)->ReleaseByteArrayElements(env, jpk, pkbytes, JNI_ABORT);
        (*env)->DeleteLocalRef(env, jpk);
        CHECK_THROW(env, ok==1, "java/lang/IllegalArgumentException", "invalid secp256k1 pubkey", 0);
    }
    *out_n = (size_t)n;
    return 1;
}

/* ---------- 工具：解析 [B(33) -> pubkey ---------- */
static int parse_pubkey33(JNIEnv* env, jbyteArray jpk33, secp256k1_pubkey* out) {
    REQ_NOT_NULL(env, jpk33, "subPk33", 0);
    jsize len = (*env)->GetArrayLength(env, jpk33);
    CHECK_THROW(env, len == 33, "java/lang/IllegalArgumentException", "subPk33 must be 33 bytes", 0);
    jboolean isCopy = 0;
    jbyte* pkbytes = (*env)->GetByteArrayElements(env, jpk33, &isCopy);
    int ok = secp256k1_ec_pubkey_parse(g_ctx, out, (const unsigned char*)pkbytes, 33);
    (*env)->ReleaseByteArrayElements(env, jpk33, pkbytes, JNI_ABORT);
    CHECK_THROW(env, ok==1, "java/lang/IllegalArgumentException", "invalid subPk33", 0);
    return 1;
}

/* ===================  native 实现 =================== */

/* whitelistSign([[B online], [[B offline], [B sub], [B online_sk], [B summed_sk], int index) -> [B sig */
static jbyteArray native_whitelistSign(JNIEnv* env, jclass clazz,
                                       jobjectArray jOnlinePk33,
                                       jobjectArray jOfflinePk33,
                                       jbyteArray   jSubPk33,
                                       jbyteArray   jOnlineSk32,
                                       jbyteArray   jSummedSk32,
                                       jint         jIndex) {
    (void)clazz;
    REQ_NOT_NULL(env, g_ctx, "context", NULL);
    REQ_NOT_NULL(env, jOnlinePk33, "onlinePk33", NULL);
    REQ_NOT_NULL(env, jOfflinePk33, "offlinePk33", NULL);
    REQ_NOT_NULL(env, jSubPk33, "subPk33", NULL);
    REQ_NOT_NULL(env, jOnlineSk32, "onlineSk32", NULL);
    REQ_NOT_NULL(env, jSummedSk32, "summedSk32", NULL);

    jsize nOnline = (*env)->GetArrayLength(env, jOnlinePk33);
    jsize nOffline = (*env)->GetArrayLength(env, jOfflinePk33);
    CHECK_THROW(env, nOnline == nOffline, "java/lang/IllegalArgumentException", "online/offline size mismatch", NULL);
    CHECK_THROW(env, nOnline > 0, "java/lang/IllegalArgumentException", "no keys provided", NULL);
    CHECK_THROW(env, nOnline <= MAX_KEYS, "java/lang/IllegalArgumentException", "too many keys", NULL);

    secp256k1_pubkey* online = (secp256k1_pubkey*) malloc(sizeof(secp256k1_pubkey) * (size_t)nOnline);
    secp256k1_pubkey* offline= (secp256k1_pubkey*) malloc(sizeof(secp256k1_pubkey) * (size_t)nOffline);
    CHECK_THROW(env, online && offline, "java/lang/OutOfMemoryError", "malloc failed", NULL);

    size_t n1=0,n2=0;
    if (!parse_pubkeys(env, jOnlinePk33, online, &n1)) { free(online); free(offline); return NULL; }
    if (!parse_pubkeys(env, jOfflinePk33, offline,&n2)) { free(online); free(offline); return NULL; }

    secp256k1_pubkey sub;
    if (!parse_pubkey33(env, jSubPk33, &sub)) { free(online); free(offline); return NULL; }

    jsize len1 = (*env)->GetArrayLength(env, jOnlineSk32);
    jsize len2b= (*env)->GetArrayLength(env, jSummedSk32);
    CHECK_THROW(env, len1==32, "java/lang/IllegalArgumentException", "onlineSk32 must be 32 bytes", NULL);
    CHECK_THROW(env, len2b==32, "java/lang/IllegalArgumentException", "summedSk32 must be 32 bytes", NULL);
    CHECK_THROW(env, jIndex>=0 && jIndex<nOnline, "java/lang/IllegalArgumentException", "index out of range", NULL);

    jboolean c1=0, c2=0;
    unsigned char* online_sk = (unsigned char*)(*env)->GetByteArrayElements(env, jOnlineSk32, &c1);
    unsigned char* summed_sk = (unsigned char*)(*env)->GetByteArrayElements(env, jSummedSk32, &c2);

    secp256k1_whitelist_signature sig;
    int ok = secp256k1_whitelist_sign(
        g_ctx, &sig,
        online, offline, (size_t)nOnline,
        &sub,
        (const unsigned char*)online_sk,
        (const unsigned char*)summed_sk,
        (size_t)jIndex
    );

    (*env)->ReleaseByteArrayElements(env, jOnlineSk32, (jbyte*)online_sk, JNI_ABORT);
    (*env)->ReleaseByteArrayElements(env, jSummedSk32, (jbyte*)summed_sk, JNI_ABORT);
    free(online); free(offline);

    CHECK_THROW(env, ok==1, "java/lang/RuntimeException", "secp256k1_whitelist_sign failed", NULL);

    size_t out_len = 33 + 32 * (size_t)nOnline;
    unsigned char* out_buf = (unsigned char*) malloc(out_len);
    CHECK_THROW(env, out_buf, "java/lang/OutOfMemoryError", "malloc failed", NULL);

    size_t tmp = out_len;
    int ok2 = secp256k1_whitelist_signature_serialize(g_ctx, out_buf, &tmp, &sig);
    if (!(ok2==1 && tmp==out_len)) {
        free(out_buf);
        CHECK_THROW(env, 0, "java/lang/RuntimeException", "whitelist_signature_serialize failed", NULL);
    }

    jbyteArray jret = (*env)->NewByteArray(env, (jsize)out_len);
    if (!jret) { free(out_buf); return NULL; } /* OOME */
    (*env)->SetByteArrayRegion(env, jret, 0, (jsize)out_len, (const jbyte*)out_buf);
    free(out_buf);
    return jret;
}

/* whitelistVerify([B sig, [[B online], [[B offline], [B sub]) -> boolean */
static jboolean native_whitelistVerify(JNIEnv* env, jclass clazz,
                                       jbyteArray   jSigBytes,
                                       jobjectArray jOnlinePk33,
                                       jobjectArray jOfflinePk33,
                                       jbyteArray   jSubPk33) {
    (void)clazz;
    REQ_NOT_NULL(env, g_ctx, "context", JNI_FALSE);
    REQ_NOT_NULL(env, jSigBytes, "sigBytes", JNI_FALSE);
    REQ_NOT_NULL(env, jOnlinePk33, "onlinePk33", JNI_FALSE);
    REQ_NOT_NULL(env, jOfflinePk33, "offlinePk33", JNI_FALSE);
    REQ_NOT_NULL(env, jSubPk33, "subPk33", JNI_FALSE);

    jsize nOnline = (*env)->GetArrayLength(env, jOnlinePk33);
    jsize nOffline= (*env)->GetArrayLength(env, jOfflinePk33);
    CHECK_THROW(env, nOnline==nOffline, "java/lang/IllegalArgumentException", "online/offline size mismatch", JNI_FALSE);
    CHECK_THROW(env, nOnline>0, "java/lang/IllegalArgumentException", "no keys provided", JNI_FALSE);
    CHECK_THROW(env, nOnline<=MAX_KEYS, "java/lang/IllegalArgumentException", "too many keys", JNI_FALSE);

    secp256k1_pubkey* online = (secp256k1_pubkey*) malloc(sizeof(secp256k1_pubkey)*(size_t)nOnline);
    secp256k1_pubkey* offline= (secp256k1_pubkey*) malloc(sizeof(secp256k1_pubkey)*(size_t)nOffline);
    CHECK_THROW(env, online && offline, "java/lang/OutOfMemoryError", "malloc failed", JNI_FALSE);

    size_t n1=0,n2=0;
    if (!parse_pubkeys(env, jOnlinePk33, online, &n1)) { free(online); free(offline); return JNI_FALSE; }
    if (!parse_pubkeys(env, jOfflinePk33, offline, &n2)) { free(online); free(offline); return JNI_FALSE; }

    secp256k1_pubkey sub;
    if (!parse_pubkey33(env, jSubPk33, &sub)) { free(online); free(offline); return JNI_FALSE; }

    jsize siglen = (*env)->GetArrayLength(env, jSigBytes);
    jboolean cp=0;
    unsigned char* sigbytes = (unsigned char*)(*env)->GetByteArrayElements(env, jSigBytes, &cp);

    secp256k1_whitelist_signature sig;
    int okp = secp256k1_whitelist_signature_parse(g_ctx, &sig, sigbytes, (size_t)siglen);

    (*env)->ReleaseByteArrayElements(env, jSigBytes, (jbyte*)sigbytes, JNI_ABORT);
    if (!okp) { free(online); free(offline); return JNI_FALSE; }

    int ok = secp256k1_whitelist_verify(g_ctx, &sig, online, offline, (size_t)nOnline, &sub);
    free(online); free(offline);
    return ok ? JNI_TRUE : JNI_FALSE;
}


JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* reserved) {
    (void)reserved;
    JNIEnv* env = NULL;
    if ((*vm)->GetEnv(vm, (void**)&env, JNI_VERSION_1_8) != JNI_OK) return JNI_ERR;

    /* 初始化 secp256k1 上下文 */
    g_ctx = secp256k1_context_create(SECP256K1_CONTEXT_NONE);
    if (!g_ctx) return JNI_ERR;

    return JNI_VERSION_1_8;
}

JNIEXPORT void JNICALL JNI_OnUnload(JavaVM* vm, void* reserved) {
    (void)vm; (void)reserved;
    if (g_ctx) { secp256k1_context_destroy(g_ctx); g_ctx = NULL; }
}

JNIEXPORT jbyteArray JNICALL
Java_sdk_Secp256k1Ring_whitelistSign(JNIEnv* env, jclass clazz,
                                     jobjectArray jOnlinePk33,
                                     jobjectArray jOfflinePk33,
                                     jbyteArray   jSubPk33,
                                     jbyteArray   jOnlineSk32,
                                     jbyteArray   jSummedSk32,
                                     jint         jIndex) {
    return native_whitelistSign(env, clazz, jOnlinePk33, jOfflinePk33,
                                jSubPk33, jOnlineSk32, jSummedSk32, jIndex);
}

// Java 方法：public static native boolean whitelistVerify(byte[], byte[][], byte[][], byte[]);
JNIEXPORT jboolean JNICALL
Java_sdk_Secp256k1Ring_whitelistVerify(JNIEnv* env, jclass clazz,
                                       jbyteArray   jSigBytes,
                                       jobjectArray jOnlinePk33,
                                       jobjectArray jOfflinePk33,
                                       jbyteArray   jSubPk33) {
    return native_whitelistVerify(env, clazz, jSigBytes, jOnlinePk33, jOfflinePk33, jSubPk33);
}

// === 服务器端（可选）：org.mitre.openid.connect.RingVerifier 只需要 verify ===
JNIEXPORT jboolean JNICALL
Java_org_mitre_openid_connect_RingVerifier_whitelistVerify(JNIEnv* env, jclass clazz,
                                                            jbyteArray   jSigBytes,
                                                            jobjectArray jOnlinePk33,
                                                            jobjectArray jOfflinePk33,
                                                            jbyteArray   jSubPk33) {
    return native_whitelistVerify(env, clazz, jSigBytes, jOnlinePk33, jOfflinePk33, jSubPk33);
}
