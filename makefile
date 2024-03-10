xpi: 
	rm -f ./*.xpi
	zip -r -9 ToggleNativeTabBar.xpi ToggleNativeTabBar.zip background.js manifest.json icon-hidden.png icon-visible.png menu.png MinMaxClose.png options.html options.css -x '*/.*' >/dev/null 2>/dev/null
