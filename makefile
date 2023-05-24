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
	node scripts/commodity/dyFeAlloyMonitor.js
	node scripts/commodity/neodymiumMonitor.js
	node scripts/commodity/neodymiumOxideMonitor.js
	node scripts/commodity/praseodymiumMonitor.js
	node scripts/commodity/praseodymiumNeodymiumOxideMonitor.js
	git add .
	git commit -m 'chore: sync commodity monitor'
	git push origin master

unlock-stock:
	node scripts/unlockStockList.js
	git add .
	git commit -m 'chore: sync unlock stock list'
	git push origin master
