#############################################
SCRIPT_NAME := koala

script:
	node ./scripts/${SCRIPT_NAME}.js

commodity-monitor:
	node scripts/neodymiumMonitor.js
	node scripts/praseodymiumMonitor.js
	node scripts/praseodymiumNeodymiumOxideMonitor.js
	git add .
	git commit -m 'chore: sync commodity monitor'
	git push origin master
