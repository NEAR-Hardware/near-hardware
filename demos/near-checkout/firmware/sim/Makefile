# Host build of the till UI + 1Click logic (needs: brew install libsodium, and
# `pio pkg install` once in firmware/ for ArduinoJson).
#   make            build, run the tests, render ../../screens/*.png
#   ./sim --verify quote.json ...   check 1Click quote signatures like the board does
SRC = sim_main.cpp ../src/app.cpp ../src/gfx.cpp ../src/checkout.cpp
BREW ?= /opt/homebrew
JSON = ../.pio/libdeps/checkout/ArduinoJson/src
CXXFLAGS = -std=c++17 -O1 -Wall -Wno-unused-function -I../src -I../lib/qrcodegen -I$(JSON) -I$(BREW)/include \
           -DARDUINOJSON_USE_LONG_LONG=1 -DARDUINOJSON_USE_DOUBLE=1
LDFLAGS = -L$(BREW)/lib -lsodium -lz

all: run

sim: $(SRC) ../src/*.h qrcodegen.o
	$(CXX) $(CXXFLAGS) $(SRC) qrcodegen.o -o $@ $(LDFLAGS)

qrcodegen.o: ../lib/qrcodegen/qrcodegen.c
	$(CC) -O1 -c $< -o $@

run: sim
	./sim ../../screens

clean:
	rm -f sim qrcodegen.o
