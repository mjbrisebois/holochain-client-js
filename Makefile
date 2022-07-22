#
# Project
#
package-lock.json:	package.json
	npm install
	touch $@
node_modules:		package-lock.json
	npm install
	touch $@
build:			node_modules


MOCHA_OPTS		= -t 5000
#
# Testing
#
test:			build test-setup
	npx mocha $(MOCHA_OPTS) --recursive ./tests
test-debug:		build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) --recursive ./tests

test-unit:		build test-setup
	npx mocha $(MOCHA_OPTS) ./tests/unit
test-unit-debug:	build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/unit

test-integration:		build test-setup
	npx mocha $(MOCHA_OPTS) ./tests/integration
test-integration-debug:		build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/integration
test-integration-debug-%:	build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/integration/test_$*.js

test-e2e:		prepare-package build test-setup
	npx mocha $(MOCHA_OPTS) ./tests/e2e
test-e2e-debug:		prepare-package build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/e2e
test-e2e-debug-%:	prepare-package build test-setup
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/e2e/test_$*.js
test-setup:


#
# Repository
#
clean-remove-chaff:
	@find . -name '*~' -exec rm {} \;
clean-files:		clean-remove-chaff
	git clean -nd
clean-files-force:	clean-remove-chaff
	git clean -fd
clean-files-all:	clean-remove-chaff
	git clean -ndx
clean-files-all-force:	clean-remove-chaff
	git clean -fdx


#
# NPM packaging
#
prepare-package:
	FILENAME=holochain-client.js WEBPACK_MODE=development npm run build
	npm run build
	gzip -kf dist/*.js
preview-package:	clean-files test prepare-package
	npm pack --dry-run .
create-package:		clean-files test prepare-package
	npm pack .
publish-package:	clean-files test prepare-package
	npm publish --access public .
