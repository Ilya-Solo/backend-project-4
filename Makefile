test:
	NODE_OPTIONS=--experimental-vm-modules npx jest

lint:
	npx eslint src

coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --coverage