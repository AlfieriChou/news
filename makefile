#############################################
SCRIPT_NAME := koala

script:
	node ./scripts/${SCRIPT_NAME}.js

koala:
	git pull origin master
	SCRIPT_NAME=koala make script
	git add .
	git commit -m 'chore: sync koala hacker news'
	git push origin master

commodity-monitor:
	git pull origin master
	node scripts/commodity/monitor.js
	git add .
	git commit -m 'chore: sync commodity monitor'
	git push origin master

unlock-stock:
	git pull origin master
	node scripts/unlockStockList.js
	git add .
	git commit -m 'chore: sync unlock stock list'
	git push origin master

bill-melinda-gates:
	git pull origin master
	node scripts/billMelindaGatesFoundationTrust.js
	git add .
	git commit -m 'chore: sync bill & melinda gates foundation trust list'
	git push origin master
