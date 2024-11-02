xpi: 
	rm -f ./*.xpi
	zip -r -9 ToggleNativeTabBar.xpi ToggleNativeTabBar.zip prism.css prism.js background.js manifest.json icon-hidden.png icon-visible.png menu.png MinMaxClose.png options.js options.html options.css -x '*/.*' >/dev/null 2>/dev/null
