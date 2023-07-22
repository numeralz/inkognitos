

set -x


function encFull {
ffmpeg -y -i "$IN"  -c:v libx264  -filter:v "setpts=$(bc <<<"scale=3;1/$SPEED")*PTS"  -bsf:v "h264_mp4toannexb" "raw.h264"
ffmpeg -y -fflags +genpts -r 60 -i "raw.h264" "$OUT"
rm -f "raw.h264"
}

# function enc {
# ffmpeg -y -ss $START -to $END -i "$IN"  -c:v libx264  -filter:v "setpts=$(bc <<<"scale=3;1/$SPEED")*PTS"  -bsf:v "h264_mp4toannexb" "raw.h264"
# ffmpeg -y -fflags +genpts -r 60 -i "raw.h264" "$OUT"
# rm -f "raw.h264"
# }


IN='2022-06-23 14-46-18.mp4' \
OUT="sample-1.mp4" \
SPEED="20" \
encFull

IN='2022-06-23 14-49-15.mp4' \
OUT="sample-2.mp4" \
SPEED="20" \
encFull

IN='2022-06-23 14-51-56.mp4' \
OUT="sample-3.mp4" \
SPEED="20" \
encFull

IN='2022-06-23 14-54-27.mp4' \
OUT="sample-4.mp4" \
SPEED="20" \
encFull

