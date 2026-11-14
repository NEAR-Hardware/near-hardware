# Host build of the watch UI + wallet core (needs: brew install libsodium)
#   make          build, run the tests, render ../../screens/*.png
#   make mainnet  the same for the mainnet build (-DNEAR_MAINNET), into ../../screens/mainnet/
SRC = sim_main.cpp crypto_host.cpp ../src/app.cpp ../src/gfx.cpp ../src/wallet_core.cpp
BREW ?= /opt/homebrew
CXXFLAGS = -std=c++17 -O1 -Wall -Wno-unused-function -I../src -I../lib/qrcodegen -I$(BREW)/include
LDFLAGS = -L$(BREW)/lib -lsodium -lz

all: run

.PHONY: all run mainnet clean

sim: $(SRC) ../src/*.h qrcodegen.o
	$(CXX) $(CXXFLAGS) $(SRC) qrcodegen.o -o $@ $(LDFLAGS)

qrcodegen.o: ../lib/qrcodegen/qrcodegen.c
	$(CC) -O1 -c $< -o $@

sim-mainnet: $(SRC) ../src/*.h qrcodegen.o
	$(CXX) $(CXXFLAGS) -DNEAR_MAINNET $(SRC) qrcodegen.o -o $@ $(LDFLAGS)

run: sim
	./sim ../../screens

mainnet: sim-mainnet
	mkdir -p ../../screens/mainnet
	./sim-mainnet ../../screens/mainnet

clean:
	rm -f sim sim-mainnet qrcodegen.o
