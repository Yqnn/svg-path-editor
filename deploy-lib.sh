#! /bin/sh

set -e

git clone "https://github.com/Yqnn/svg-path-editor.git" .svg-path-editor-master
cd .svg-path-editor-master
npm install
npm run build-svg-lib
cd src/lib
npm publish
TAG=`npm pkg get version | tr -d \"`
git tag $TAG
git push origin $TAG

cd ../../..
rm -rf .svg-path-editor-master