#!/bin/bash
#
# run this script to prep recordings for harry-tuttle playback by transcoding to opus
# usage: transcode.sh infile outfile

ffmpeg -i $1 -f s16le -ar 48000 -ac 2 - | opusenc --raw - $2
