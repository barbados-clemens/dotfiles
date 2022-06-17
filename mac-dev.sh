#!/bin/zsh

echo "WARNING! DON'T RUN THIS. IT HASN'T BEEN UPDATED IN A LONG TIME AND MIGHT DO SOMETHING BAD IDK. USE AS A REFERENCE"
exit 1;
# make sure nvm is loaded
. ~/.nvm/nvm.sh

echo "---- Dev Env Set up ----"
nvm --version
nvm install 12
nvm install --lts
nvm alias default 12
nvm list

echo "---- Get Global Packages with NPM ----"

declare -a pack=(
                "@angular/cli"
                )

for p in "${pack[@]}"
do
  npm i -g $p
done

git clone https://github.com/denysdovhan/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt"
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"

git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k

git clone https://github.com/MichaelAquilina/zsh-you-should-use.git $ZSH_CUSTOM/plugins/you-should-use

curl https://github.com/barbados-clemens/dotfiles/raw/main/.zshrc --output .zshrc
mv .zshrc ~/.zshrc

#curl https://github.com/barbados-clemens/dotfiles/raw/main/starship.toml --output starship.toml
#mkdir -p ~/.config
#mv starship.toml ~/.config/starship.toml

curl https://github.com/barbados-clemens/dotfiles/raw/main/.p10k.zsh --output .p10k.zsh
mv .p10k.zsh ~/.p10k.zsh

# curl https://github.com/barbados-clemens/dotfiles/raw/main/terminus.config.yml --output config.yaml
# mv config.yaml ~/Library/Application Support/terminus/

mkdir -p ~/Work
mkdir -p ~/OSS
mkdir -p ~/Sandbox

echo "done"

