cmake_minimum_required(VERSION 3.13)

# Windows/MinGW 生成 DLL 时去掉 lib 前缀，确保输出 .dll
if (MINGW)
  set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)  # 保险：自动导出 JNI 符号
endif()

# 头文件
include_directories(
  "C:/Program Files/Java/jdk-1.8/include"
  "C:/Program Files/Java/jdk-1.8/include/win32"
  "D:/secp256k1-zkp/include"
)

# JNI 源文件（与你的 secp256k1zkp_jni.c 同目录）
add_library(secp256k1zkp_jni SHARED
  secp256k1zkp_jni.c
)

# 用绝对路径直接链接 import lib（请确保此文件存在）
set(SECP256K1_IMPORT_LIB "D:/secp256k1-zkp/build/src/libsecp256k1.dll.a")
if (NOT EXISTS "${SECP256K1_IMPORT_LIB}")
  message(FATAL_ERROR "Not found: ${SECP256K1_IMPORT_LIB}")
endif()
target_link_libraries(secp256k1zkp_jni "${SECP256K1_IMPORT_LIB}")

# 修正 MinGW 下 DLL 文件名（去掉前缀 lib）
if (MINGW)
  set_target_properties(secp256k1zkp_jni PROPERTIES PREFIX "" SUFFIX ".dll")
endif()

# 默认 Release
if (NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()