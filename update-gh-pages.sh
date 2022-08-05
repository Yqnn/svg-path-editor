#! /bin/sh

set -e

git clone "https://github.com/Yqnn/svg-path-editor.git" .svg-path-editor-master
cd .svg-path-editor-master
npm install
npm run build-prod
git checkout gh-pages
rm -rf *.ico *.html *.js *.css *.txt assets
mv dist/svg-path-editor/* .
git add --all
git commit -m "Refreshed gh-pages from master"
git show --stat

read -p "Confirm publication? [yn] " -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo
    git push origin gh-pages

fi
echo

cd ..
rm -rf .svg-path-editor-master
