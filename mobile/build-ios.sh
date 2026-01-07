#!/bin/bash

# CleanPic iOS 构建和上传脚本
# 用法: ./build-ios.sh [debug|release|upload]

set -e

BUILD_TYPE=${1:-release}

echo "=========================================="
echo "🖼️  CleanPic iOS 构建脚本"
echo "=========================================="

# 项目配置
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_DIR="$PROJECT_DIR/ios"
SCHEME="CleanPic"
WORKSPACE="$IOS_DIR/CleanPic.xcworkspace"
PROJECT="$IOS_DIR/CleanPic.xcodeproj"
TEAM_ID="EP73U6E2WX"
BUNDLE_ID="com.linzaixinhua.watermarkremove"

# 构建目录
BUILD_DIR="$PROJECT_DIR/build"
ARCHIVE_PATH="$BUILD_DIR/CleanPic.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"

# 创建构建目录
mkdir -p "$BUILD_DIR"

# App Store Connect 配置
API_KEY_ID="95G6R4X3CS"
ISSUER_ID="69a6de87-e955-47e3-e053-5b8c7c11a4d1"

# 查找密钥文件
AUTH_KEY_DIR="$HOME/.private_keys"
AUTH_KEY_FILE="$AUTH_KEY_DIR/AuthKey_${API_KEY_ID}.p8"

if [ ! -f "$AUTH_KEY_FILE" ]; then
    POTENTIAL_KEY="$PROJECT_DIR/../AuthKey_${API_KEY_ID}.p8"
    if [ -f "./AuthKey_${API_KEY_ID}.p8" ]; then
        AUTH_KEY_FILE="./AuthKey_${API_KEY_ID}.p8"
    elif [ -f "$POTENTIAL_KEY" ]; then
        AUTH_KEY_FILE="$POTENTIAL_KEY"
    fi
fi

# 检查 iOS 目录是否存在
if [ ! -d "$IOS_DIR" ]; then
    echo "📱 iOS 目录不存在，正在生成原生代码..."
    cd "$PROJECT_DIR"
    npx expo prebuild --platform ios --clean
    echo "✅ iOS 原生代码生成完成"
    echo ""
fi

# 检查是否使用 workspace
if [ -d "$WORKSPACE" ]; then
    BUILD_TARGET="-workspace $WORKSPACE"
else
    BUILD_TARGET="-project $PROJECT"
fi

# 构建配置
CONFIGURATION="Release"
if [ "$BUILD_TYPE" = "debug" ]; then
    CONFIGURATION="Debug"
fi

echo "📋 配置信息:"
echo "   Scheme: $SCHEME"
echo "   Configuration: $CONFIGURATION"
echo "   Team ID: $TEAM_ID"
echo "   Bundle ID: $BUNDLE_ID"
echo ""

if [ "$BUILD_TYPE" != "upload" ]; then
    # 自动增加 Build Number
    PLIST_PATH="$IOS_DIR/CleanPic/Info.plist"
    if [ -f "$PLIST_PATH" ]; then
        CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$PLIST_PATH" 2>/dev/null || echo "1")
        
        if ! [[ "$CURRENT_BUILD" =~ ^[0-9]+$ ]]; then
            echo "⚠️  Current build version is not a number ('$CURRENT_BUILD'). Resetting to 1."
            CURRENT_BUILD=0
        fi
        
        NEW_BUILD=$((CURRENT_BUILD + 1))
        
        echo "🔢 更新 Build Number: $CURRENT_BUILD -> $NEW_BUILD"
        /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$PLIST_PATH"
    else
        echo "⚠️  未找到 Info.plist，跳过版本递增"
    fi

    # 步骤 1: 安装依赖
    echo "📦 步骤 1/5: 安装依赖..."
    cd "$PROJECT_DIR"
    npm install --legacy-peer-deps
    cd "$IOS_DIR"
    pod install --repo-update
    echo "✅ 依赖安装完成"
    echo ""

    # 步骤 2: 清理
    echo "🧹 步骤 2/5: 清理构建目录..."
    xcodebuild clean $BUILD_TARGET -scheme "$SCHEME" -configuration "$CONFIGURATION" 2>/dev/null || true
    echo "✅ 清理完成"
    echo ""

    # 步骤 3: 构建 Archive
    echo "🔨 步骤 3/5: 构建 Archive..."
    xcodebuild archive \
        $BUILD_TARGET \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -destination 'generic/platform=iOS' \
        -archivePath "$ARCHIVE_PATH" \
        -allowProvisioningUpdates

    if [ ! -d "$ARCHIVE_PATH" ]; then
        echo "❌ Archive 构建失败"
        exit 1
    fi
    echo "✅ Archive 构建完成: $ARCHIVE_PATH"
    echo ""

    # 步骤 4: 创建导出配置
    echo "📝 步骤 4/5: 创建导出配置..."
    EXPORT_OPTIONS_PATH="$BUILD_DIR/ExportOptions.plist"
    cat > "$EXPORT_OPTIONS_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${BUNDLE_ID}</key>
        <string>watermarkremove_appstore</string>
    </dict>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
EOF
    echo "✅ 导出配置已创建"
    echo ""

    # 步骤 5: 导出 IPA
    echo "📱 步骤 5/5: 导出 IPA..."
    rm -rf "$EXPORT_PATH"
    mkdir -p "$EXPORT_PATH"

    xcodebuild -exportArchive \
        -archivePath "$ARCHIVE_PATH" \
        -exportOptionsPlist "$EXPORT_OPTIONS_PATH" \
        -exportPath "$EXPORT_PATH" \
        -allowProvisioningUpdates

    IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" -type f | head -1)
    if [ -z "$IPA_FILE" ]; then
        echo "❌ IPA 导出失败"
        exit 1
    fi
    echo "✅ IPA 导出完成: $IPA_FILE"
    echo ""

else
    # 仅上传模式
    IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" -type f | head -1)
    if [ -z "$IPA_FILE" ]; then
        echo "❌ 未找到 IPA 文件。请先运行完整构建: ./build-ios.sh release"
        exit 1
    fi
    echo "📦 使用现有 IPA: $IPA_FILE"
fi

# 上传到 App Store Connect
if [ "$BUILD_TYPE" = "upload" ] || [ "$BUILD_TYPE" = "release" ]; then
    echo "🚀 上传到 App Store Connect..."
    echo "   API Key ID: $API_KEY_ID"
    echo "   Key File: $AUTH_KEY_FILE"
    
    MISSING_INFO=0
    if [ -z "$ISSUER_ID" ]; then
        echo "⚠️  缺少 Issuer ID。"
        MISSING_INFO=1
    fi
    
    if [ ! -f "$AUTH_KEY_FILE" ]; then
        echo "⚠️  未找到密钥文件 AuthKey_${API_KEY_ID}.p8"
        echo "   请将密钥文件放在以下位置之一："
        echo "   - $HOME/.private_keys/AuthKey_${API_KEY_ID}.p8"
        echo "   - $PROJECT_DIR/AuthKey_${API_KEY_ID}.p8"
        MISSING_INFO=1
    fi

    if [ $MISSING_INFO -eq 1 ]; then
        echo ""
        echo "❌ 无法自动上传，请手动上传 IPA:"
        echo "   $IPA_FILE"
        echo ""
        echo "或使用 Transporter App 上传"
    else
        echo "📤 准备上传..."
        PRIVATE_KEYS_DIR="$HOME/.private_keys"
        mkdir -p "$PRIVATE_KEYS_DIR"
        DEST_KEY_FILE="$PRIVATE_KEYS_DIR/AuthKey_${API_KEY_ID}.p8"
        
        if [ "$AUTH_KEY_FILE" != "$DEST_KEY_FILE" ]; then
            echo "🔑 正在安装密钥到 $PRIVATE_KEYS_DIR..."
            cp "$AUTH_KEY_FILE" "$DEST_KEY_FILE"
        fi
        
        echo "📤 开始上传到 App Store..."
        xcrun altool --upload-app -f "$IPA_FILE" -t ios --apiKey "$API_KEY_ID" --apiIssuer "$ISSUER_ID"
        
        if [ $? -eq 0 ]; then
            echo "✅ 上传成功！请前往 App Store Connect 查看"
        else
            echo "❌ 上传失败"
            exit 1
        fi
    fi
fi

echo ""
echo "=========================================="
echo "✅ 完成!"
echo "=========================================="

