#!/bin/bash
# need to install antlr 4.7.1 and set alias at first,
# use `source ./build.sh` to run.
cd ./src
antlr4 sfcLexer.g4 sfcParser.g4 -Dlanguage=JavaScript -o ./lib
cd ..