#!/usr/bin/bash
ROOT_DIR="$PWD"
USER_DIR="$HOME"

confirm () {
    while true; do
        read -p "$1 " yn
        case ${yn:-$2} in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

if [[ "$1" == "" ]]; then 
    echo " Command missing! \n"
  else 
    cd $ROOT_DIR
	case "$1" in
    '-genico')
        echo " Generating varied size icons"
        convert app/img/logo.png -resize 16x16 app/img/favicon.ico
        convert app/img/logo.png -resize 44x44 app/img/icon_44x44.png
        convert app/img/logo.png -resize 48x48 app/img/icon_48x48.png
        convert app/img/logo.png -resize 1240x600 app/img/icon_1240x600.png
        convert app/img/logo.png -resize 300x300 app/img/icon_300x300.png
        convert app/img/logo.png -resize 150x150 app/img/icon_150x150.png
        convert app/img/logo.png -resize 88x88 app/img/icon_88x88.png
        convert app/img/logo.png -resize 24x24 app/img/icon_24x24.png
        convert app/img/logo.png -resize 50x50 app/img/icon_50x50.png
        convert app/img/logo.png -resize 620x300 app/img/icon_620x300.png
        convert app/img/logo.png -resize 192x192 app/img/icon_192x192.png
        convert app/img/logo.png -resize 144x144 app/img/icon_144x144.png
        convert app/img/logo.png -resize 96x96 app/img/icon_96x96.png
        convert app/img/logo.png -resize 72x72 app/img/icon_72x72.png
        convert app/img/logo.png -resize 36x36 app/img/icon_36x36.png
        convert app/img/logo.png -resize 1024x1024 app/img/icon_1024x1024.png
        convert app/img/logo.png -resize 180x180 app/img/icon_180x180.png
        convert app/img/logo.png -resize 152x152 app/img/icon_152x152.png
        convert app/img/logo.png -resize 120x120 app/img/icon_120x120.png
        convert app/img/logo.png -resize 76x76 app/img/icon_76x76.png
        
        echo " Done! \n"
    ;;
    '-version')
        echo " Builder   version 1.0 \n Copyright (c) 2019 Abhishek Kumar. All rights reserved. \n"
    ;;
    '-help')
        echo "\n Builder's options are:\n"
        echo "  -version       to see the current version of the app"
        echo "  -genico        to generate application icons in varied sizes & formats"
        echo "  -help          to see the menu of command line options"
        echo "\n Please choose accordingly. \n"
    ;;
    esac
fi
exit 0