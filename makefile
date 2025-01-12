xpi: 
	rm -f ./*.xpi
	zip -r -9 ToggleNativeTabBar.xpi ToggleNativeTabBar.zip prism.css background.js manifest.json icon-hidden.png icon-visible.png native-buttons.png menu.png MinMaxClose.png options.js options.html options.css -x '*/.*' >/dev/null 2>/dev/null
