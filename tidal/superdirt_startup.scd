/*
SuperDirt startup for the Algorave Kit.

Run it in SuperCollider: open this file, click anywhere inside the big
( ... ) block and press Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux).
Wait for "SuperDirt: listening to Tidal on port 57120" in the post window.

To start SuperDirt automatically every time SuperCollider opens, put this
line in your SuperCollider startup file (File > Open startup file),
replacing the path with where you cloned this repo:

    "/path/to/live_coding/tidal/superdirt_startup.scd".load;
*/

(
s.reboot { // server options only apply on reboot
	s.options.numBuffers = 1024 * 256;   // room for lots of samples
	s.options.memSize = 8192 * 32;       // raise if you see "alloc failed"
	s.options.numWireBufs = 2048;        // raise if you see "exceeded number of interconnect buffers"
	s.options.maxNodes = 1024 * 32;      // raise if you hear drop-outs / "too many nodes"
	s.options.numOutputBusChannels = 2;
	s.options.numInputBusChannels = 2;

	s.waitForBoot {
		~dirt.stop; // avoid running two copies
		~dirt = SuperDirt(2, s);

		// Default Dirt-Samples (bd, sn, amencutup, breaks165, jungbass, ...)
		~dirt.loadSoundFiles;

		// Your own samples: make folders of .wav files inside tidal/samples/
		// (one folder per sound name) and uncomment the next line.
		// ~dirt.loadSoundFiles(thisProcess.nowExecutingPath.dirname +/+ "samples/*");

		s.sync; // wait for samples to load

		// 12 orbits (d1..d12 each get their own reverb/delay bus)
		~dirt.start(57120, 0 ! 12);
		SuperDirt.default = ~dirt;
	};

	s.latency = 0.3; // raise if you see "late" messages in the post window
};
);
