#############################################
SCRIPT_NAME := koala

script:
	node ./scripts/${SCRIPT_NAME}.js

koala:
	SCRIPT_NAME=koala make script
	git add .
	git commit -m 'chore: sync koala hacker news'
	git push origin master

commodity-monitor:
	node scripts/dyFeAlloyMonitor.js
	node scripts/neodymiumMonitor.js
	node scripts/neodymiumOxideMonitor.js
	node scripts/praseodymiumMonitor.js
	node scripts/praseodymiumNeodymiumOxideMonitor.js
	git add .
	git commit -m 'chore: sync commodity monitor'
	git push origin master

unlock-stock:
	node scripts/unlockStockList.js
	git add .
	git commit -m 'chore: sync unlock stock list'
	git push origin master
