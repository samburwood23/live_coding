// One-time SuperDirt install.
//
// In the SuperCollider IDE: click anywhere inside the ( ... ) block below and
// press Ctrl+Enter (Cmd+Enter on macOS). The install script (install-ubuntu.sh)
// runs this same file from the command line.
//
// It downloads SuperDirt plus the Dirt-Samples library (about 400 MB on disk),
// so give it a few minutes. When it prints "SuperDirt OK", restart SuperCollider
// (or use Language > Recompile Class Library).

(
{
	var version = "v1.7.4";
	var dir = Quarks.folder +/+ "SuperDirt";
	var ok = { File.exists(dir +/+ "SuperDirt.quark") };

	// SuperDirt's home is now codeberg.org. Quarks can print "SuperDirt installed"
	// even when that download fails, so check the files really arrived.
	Quarks.install("SuperDirt", version);

	if(ok.value.not) {
		"Could not reach codeberg.org, so installing SuperDirt from its GitHub mirror instead.".postln;
		Quarks.uninstall("SuperDirt");
		Quarks.install("https://github.com/musikinformatik/SuperDirt.git", version);
	};

	if(ok.value) {
		"\n*** SuperDirt OK: restart SuperCollider (or recompile the class library) ***\n".postln;
	} {
		"\n*** SuperDirt FAILED to download: check your internet connection and try again ***\n".postln;
	};
}.value;
);
