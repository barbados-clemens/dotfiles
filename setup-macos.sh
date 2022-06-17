#!/bin/bash

echo "WARNING! DON'T RUN THIS. IT HASN'T BEEN UPDATED IN A LONG TIME AND MIGHT DO SOMETHING BAD IDK. USE AS A REFERENCE"
exit 1;

echo "---- Mac Set Up Script ----"
echo "---- Let's get Started ----"

# Creating Folders
mkdir ~/Documents/Code
mkdir ~/Documents/Screenshots

# Installing XCode Command Line Tools
xcode-select --install

# Installing Homebrew (Password Required!)
sudo curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install | bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
brew doctor

# Tappping...
echo "---- Tapping... ----"
brew tap homebrew/cask
brew tap homebrew/cask-drivers


echo "---- Installing Apps ----"
  brew install zsh
  sudo sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
  sudo chsh -s $(which zsh)
  echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc

  declare -a brewArr=(
                      "tree"
                      "ack"
                      "git"
                      "nvm"
                      )
    echo "..... Brew Install ....." >> ~/Desktop/install.log
  for b in "${brewArr[@]}"
  do
    echo $b >> ~/Desktop/install.log
    brew install $b
  done

  # Cask apps list
  declare -a caskArr=(
                  "alfred"                  
                  "discord"
                  "docker"
                  "firefox-developer-edition"
                  "synology-drive"
                  "iterm2"
                  "jetbrains-toolbox"
                  "gitkraken"
                  "rocket"
                  "google-chrome-canary"
                  "postman"
                  "protonvpn"
                  "royal-tsx"
                  "spotify"
                  "notable"
                  "visual-studio-code"
                  "vlc"
                  "1password"
                  "cleanshot"
                  "slack"
                  "istat-menus"
                  "zoom"
                  "plexamp"
                   )
  # Install apps through cask

  echo "Cask Install" >> ~/Desktop/install.log
  for c in "${caskArr[@]}"
  do
    echo $i >> ~/Desktop/install.log
    brew install --cask $c
  done

curl https://gitlab.com/caleb-ukle/dotfiles/raw/master/mac-dev.sh --output dev.sh

chmod +x dev.sh

open -a Terminal.app dev.sh

curl https://gitlab.com/caleb-ukle/dotfiles/raw/master/mac-settings.sh --output settings.sh

chmod +x settings.sh

open -a Terminal.app settings.sh

curl https://github.com/tonsky/FiraCode/releases/download/5.2/Fira_Code_v5.2.zip --output ~/Desktop/firaCode.zip
unzip -a ~/Desktop/firaCode.zip -d firaCode/

for entry in "firaCode/tff"/*
do
  open -a Font\ Book.app $entry
done

echo "done"
