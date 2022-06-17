#!/bin/zsh
echo "WARNING! DON'T RUN THIS. IT HASN'T BEEN UPDATED IN A LONG TIME AND MIGHT DO SOMETHING BAD IDK. USE AS A REFERENCE"
exit 1;
# From https://github.com/pawelgrzybek/dotfiles/blob/master/setup-macos.sh
# and https://github.com/mathiasbynens/dotfiles/blob/master/.macos


# Close any open System Preferences panes, to prevent them from overriding
# settings we’re about to change
osascript -e 'tell application "System Preferences" to quit'

# Ask for the administrator password upfront
sudo -v

# Keep-alive: update existing `sudo` time stamp until `.macos` has finished
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

# # # # # # # # # # # # # # # # # # # # UX SETTINGS  # # # # # # # # # # # # # # # # # # # # # # # # # # 

# Set standby delay to 24 hours (default is 1 hour)
sudo pmset -a standbydelay 86400

# Automatically quit printer app once the print jobs complete
defaults write com.apple.print.PrintingPrefs "Quit When Finished" -bool true

# Disable the “Are you sure you want to open this application?” dialog
defaults write com.apple.LaunchServices LSQuarantine -bool false

# Disable automatic termination of inactive apps
defaults write NSGlobalDomain NSDisableAutomaticTermination -bool true

# Reveal IP address, hostname, OS version, etc. when clicking the clock
# in the login window
sudo defaults write /Library/Preferences/com.apple.loginwindow AdminHostInfo HostName

# Require password immediately after sleep or screen saver begins
defaults write com.apple.screensaver askForPassword -int 1
defaults write com.apple.screensaver askForPasswordDelay -int 0

# # # # # # # # # # # # # # # # # # # # DOCK SETTINGS # # # # # # # # # # # # # # # # # # # # # # # # # # 

# System Preferences > Dock > Size:
defaults write com.apple.dock tilesize -int 42

# System Preferences > Dock > Magnification:
defaults write com.apple.dock magnification -bool true

# System Preferences > Dock > Size (magnified):
defaults write com.apple.dock largesize -int 54

# System Preferences > Dock > Automatically hide and show the Dock:
defaults write com.apple.dock autohide -bool true

# System Preferences > Dock > Minimize windows into application icon
defaults write com.apple.dock minimize-to-application -bool true

# System Preferences > Dock > Automatically hide and show the Dock:
defaults write com.apple.dock autohide -bool true

# System Preferences > Dock > Automatically hide and show the Dock (duration)
defaults write com.apple.dock autohide-time-modifier -float 0.5

# System Preferences > Dock > Automatically hide and show the Dock (delay)
defaults write com.apple.dock autohide-delay -float 0

# System Preferences > Dock > Show indicators for open applications
defaults write com.apple.dock show-process-indicators -bool true

# Don’t show recent applications in Dock
defaults write com.apple.dock show-recents -bool false

# Bottom left screen corner → Start screen saver
defaults write com.apple.dock wvous-bl-corner -int 13
defaults write com.apple.dock wvous-bl-modifier -int 0

# Bottom left screen corner → Start screen saver
defaults write com.apple.dock wvous-br-corner -int 11
defaults write com.apple.dock wvous-br-modifier -int 0

# Disable Dashboard
defaults write com.apple.dashboard mcx-disabled -bool true

# Don’t show Dashboard as a Space
defaults write com.apple.dock dashboard-in-overlay -bool true

# # # # # # # # # # # # # # # # # # # # MISSION CONTROL SETTINGS  # # # # # # # # # # # # # # # # # # # # 

# System Preferences > Mission Control > Automatically rearrange Spaces based on most recent use
defaults write com.apple.dock mru-spaces -bool false

# System Preferences > Mission Control > Dashboard
defaults write com.apple.dock dashboard-in-overlay -bool true

# # # # # # # # # # # # # # # # # # # # KEYBOARD SETTINGS # # # # # # # # # # # # # # # # # # # # # # # # 

# Updating Keyboard hold and character
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false

# System Preferences > Keyboard >
defaults write NSGlobalDomain KeyRepeat -int 1

# System Preferences > Keyboard >
defaults write NSGlobalDomain InitialKeyRepeat -int 10

# Enable full keyboard access for all controls
# (e.g. enable Tab in modal dialogs)
defaults write NSGlobalDomain AppleKeyboardUIMode -int 3

# # # # # # # # # # # # # # # # # # # # TRACKPAD SETTINGS # # # # # # # # # # # # # # # # # # # # # # # # 

# Log existing settings just incase
defaults read com.apple.Appcom.apple.AppleMultitouchTrackpad >> ~/Desktop/trackpad.txt

defaults write com.apple.AppleMultitouchTrackpad ActuateDetents -int 1 
defaults write com.apple.AppleMultitouchTrackpad Clicking -int 1 
defaults write com.apple.AppleMultitouchTrackpad DragLock -int 0 
defaults write com.apple.AppleMultitouchTrackpad Dragging -int 0 
defaults write com.apple.AppleMultitouchTrackpad FirstClickThreshold -int 1 
defaults write com.apple.AppleMultitouchTrackpad ForceSuppressed -int 0 
defaults write com.apple.AppleMultitouchTrackpad SecondClickThreshold -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadCornerSecondaryClick -int 0 
defaults write com.apple.AppleMultitouchTrackpad TrackpadFiveFingerPinchGesture -int 2 
defaults write com.apple.AppleMultitouchTrackpad TrackpadFourFingerHorizSwipeGesture -int 2 
defaults write com.apple.AppleMultitouchTrackpad TrackpadFourFingerPinchGesture -int 2 
defaults write com.apple.AppleMultitouchTrackpad TrackpadFourFingerVertSwipeGesture -int 2 
defaults write com.apple.AppleMultitouchTrackpad TrackpadHandResting -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadHorizScroll -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadMomentumScroll -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadPinch -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadRightClick -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadRotate -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadScroll -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerDrag -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerHorizSwipeGesture -int 0 
defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerTapGesture -int 0 
defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerVertSwipeGesture -int 0 
defaults write com.apple.AppleMultitouchTrackpad TrackpadTwoFingerDoubleTapGesture -int 1 
defaults write com.apple.AppleMultitouchTrackpad TrackpadTwoFingerFromRightEdgeSwipeGesture -int 3 
defaults write com.apple.AppleMultitouchTrackpad USBMouseStopsTrackpad -int 0 

# # # # # # # # # # # # # # # # # # # # Finder SETTINGS # # # # # # # # # # # # # # # # # # # # # # # # # 

# Finder > Preferences > Show all filename extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# Finder > Preferences > Show wraning before changing an extension
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

# Finder > Preferences > Show wraning before removing from iCloud Drive
defaults write com.apple.finder FXEnableRemoveFromICloudDriveWarning -bool false

# Finder > View > As List
defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv"

# Finder > View > Show Path Bar
defaults write com.apple.finder ShowPathbar -bool true

# Finder: show status bar
defaults write com.apple.finder ShowStatusBar -bool true

# Finder: disable window animations and Get Info animations
defaults write com.apple.finder DisableAllAnimations -bool true

# Set Desktop as the default location for new Finder windows
# For other paths, use `PfLo` and `file:///full/path/here/`
defaults write com.apple.finder NewWindowTarget -string "PfLo"
defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"

# Show icons for hard drives, servers, and removable media on the desktop
defaults write com.apple.finder ShowExternalHardDrivesOnDesktop -bool true
defaults write com.apple.finder ShowHardDrivesOnDesktop -bool true
defaults write com.apple.finder ShowMountedServersOnDesktop -bool true
defaults write com.apple.finder ShowRemovableMediaOnDesktop -bool true

# Finder: show hidden files by default
defaults write com.apple.finder AppleShowAllFiles -bool true

# Display full POSIX path as Finder window title
defaults write com.apple.finder _FXShowPosixPathInTitle -bool true

# When performing a search, search the current folder by default
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

# Disable the warning when changing a file extension
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

# Avoid creating .DS_Store files on network or USB volumes
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# Disable the warning before emptying the Trash
defaults write com.apple.finder WarnOnEmptyTrash -bool false

# Show the ~/Library folder
chflags nohidden ~/Library

# Show the /Volumes folder
sudo chflags nohidden /Volumes
# # # # # # # # # # # # # # # # # # # # Other SETTINGS  # # # # # # # # # # # # # # # # # # # # # # # # # 

# Changing Screenshot Dir
defaults write com.apple.screencapture location ~/Documents/Screenshots/ && killall SystemUIServer

# # Completely Disable Dashboard
defaults write com.apple.dashboard mcx-disabled -bool true

# Prevent Photos from opening automatically when devices are plugged in
defaults -currentHost write com.apple.ImageCapture disableHotPlug -bool true

# # # # # # # # # # # # # # # # # # # # Safari SETTINGS # # # # # # # # # # # # # # # # # # # # # # # # # 

# Privacy: don’t send search queries to Apple
defaults write com.apple.Safari UniversalSearchEnabled -bool false
defaults write com.apple.Safari SuppressSearchSuggestions -bool true

# Press Tab to highlight each item on a web page
defaults write com.apple.Safari WebKitTabToLinksPreferenceKey -bool true
defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2TabsToLinks -bool true

# Show the full URL in the address bar (note: this still hides the scheme)
defaults write com.apple.Safari ShowFullURLInSmartSearchField -bool true

# Prevent Safari from opening ‘safe’ files automatically after downloading
defaults write com.apple.Safari AutoOpenSafeDownloads -bool false

# Allow hitting the Backspace key to go to the previous page in history
defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2BackspaceKeyNavigationEnabled -bool true

# Enable Safari’s debug menu
defaults write com.apple.Safari IncludeInternalDebugMenu -bool true

# Enable the Develop menu and the Web Inspector in Safari
defaults write com.apple.Safari IncludeDevelopMenu -bool true
defaults write com.apple.Safari WebKitDeveloperExtrasEnabledPreferenceKey -bool true
defaults write com.apple.Safari com.apple.Safari.ContentPageGroupIdentifier.WebKit2DeveloperExtrasEnabled -bool true

# Add a context menu item for showing the Web Inspector in web views
defaults write NSGlobalDomain WebKitDeveloperExtras -bool true

# Enable continuous spellchecking
defaults write com.apple.Safari WebContinuousSpellCheckingEnabled -bool true
# Disable auto-correct
defaults write com.apple.Safari WebAutomaticSpellingCorrectionEnabled -bool false

# Warn about fraudulent websites
defaults write com.apple.Safari WarnAboutFraudulentWebsites -bool true

# Enable “Do Not Track”
defaults write com.apple.Safari SendDoNotTrackHTTPHeader -bool true


# Kill affected apps
for app in "Dock" "Finder"  do
  killall "${app}" > /dev/null 2>&1
done

# Done
echo "Done. Note that some of these changes require a logout/restart to take effect."
