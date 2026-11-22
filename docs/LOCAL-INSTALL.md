# Hub Local import and installation

Build creates install/source ZIPs, Debian package, SHA256SUMS and a pairing manifest. Import `mos-stream-0.1.0-install.zip` into Hub Local; pair `mos-stream-0.1.0-source.zip` using the manifest hashes. Debian identity is `mos-stream-plugin`, version `0.1.0-1+mos-plugin`, architecture `all`. There are no maintainer scripts, hooks or helpers. Payload is frontend assets plus license documentation.

Import/archive is distinct from installing. No import or installation is performed by build scripts. Keep existing packages/settings recoverable. Let the Hub validate paths, checksums and Debian identity; install through the reviewed host transaction. Never use a remote Hub Update action to select this local build. Defaults must not replace existing settings. Only one active numeric version should remain in the boot-scanned plugin folder; preserve previous versions on a data pool rather than deleting recovery material.

After installation fully refresh MOS (federation modules may be cached), open MOS Stream, save the selected URL, reconnect, reopen/reload to check persistence, and verify live Selkies video, keyboard/pointer/audio and supported browser features. Test the stream directly if framing fails. Closing MOS Stream must leave the remote application running. Record the actual MOS version and stream URL origin without logging credentials.

Source ZIP root is `mos-stream/`. Both ZIPs, their checksums and matching source should be retained together. Do not claim a package/fixture pass proves live host compatibility. Installation, reboot, rollback and remote catalog publication are separate operations.
