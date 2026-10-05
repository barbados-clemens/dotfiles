#!/usr/bin/env bash
set -euo pipefail

if ! command -v exiftool >/dev/null 2>&1; then
  printf 'Install ExifTool first (for example: brew install exiftool).\n' >&2
  exit 1
fi

if (( $# > 1 )); then
  printf 'Usage: %s [photo-folder]\n' "$0" >&2
  exit 1
fi

folder=${1:-}
if [[ -z $folder ]]; then
  read -r -p 'Photo folder [current directory]: ' folder
  folder=${folder:-.}
fi
if [[ ! -d $folder ]]; then
  printf 'Not a folder: %s\n' "$folder" >&2
  exit 1
fi

shopt -s nullglob nocaseglob
photos=( "$folder"/*.jpg "$folder"/*.jpeg )
if (( ${#photos[@]} == 0 )); then
  printf 'No JPG or JPEG files in: %s\n' "$folder" >&2
  exit 1
fi

ask_required() {
  local prompt=$1 value
  while true; do
    read -r -p "$prompt: " value
    if [[ -n ${value//[[:space:]]/} ]]; then
      REPLY=$value
      return
    fi
    printf 'This field is required.\n' >&2
  done
}

# There is no general EXIF film-stock field. Use a standard XMP keyword instead.
ask_required 'Film stock (for example, Kodak Portra 400)'
film_stock=$REPLY
while true; do
  ask_required 'Film ISO (positive whole number)'
  iso=$REPLY
  [[ $iso =~ ^[1-9][0-9]*$ ]] && break
  printf 'Enter a positive whole number, such as 400.\n' >&2
done
ask_required 'Camera body (for example, Canon AE-1)'
camera=$REPLY
ask_required 'Lens (for example, Canon FD 50mm f/1.8)'
lens=$REPLY
read -r -p 'Location name (optional, for example Central Park): ' location

printf '\n%s JPG/JPEG files in %s\n' "${#photos[@]}" "$folder"
printf 'Film: %s | ISO: %s | Camera: %s | Lens: %s\n' "$film_stock" "$iso" "$camera" "$lens"
[[ -z $location ]] || printf 'Location: %s\n' "$location"
read -r -p 'Write metadata to these files? [y/N] ' confirm
case $confirm in
  y|Y|yes|YES|Yes) ;;
  *) printf 'No files changed.\n'; exit 0 ;;
esac

# EXIF stores the camera, lens, and ISO. Standard XMP fields store the
# film stock as a keyword and the optional place name as an IPTC location.
# No custom metadata namespace or nonstandard EXIF tag is used.
tags=(
  "-EXIF:ISO=$iso"
  "-EXIF:Model=$camera"
  "-EXIF:LensModel=$lens"
  "-XMP-dc:Subject-=Film stock: $film_stock"
  "-XMP-dc:Subject+=Film stock: $film_stock"
)
if [[ -n $location ]]; then
  tags+=( "-XMP-iptcCore:Location=$location" )
fi

# ExifTool makes a *_original backup for every changed photo.
# -P preserves each photo's filesystem modification time.
exiftool -P -ext jpg -ext jpeg "${tags[@]}" -- "$folder"
