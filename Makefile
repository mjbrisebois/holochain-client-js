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

use-local-admin-client:
	cd tests; npm uninstall @whi/holochain-admin-client
	cd tests; npm install --save ../../holochain-admin-client-js/
use-npm-admin-client:
	cd tests; npm uninstall @whi/holochain-admin-client
	cd tests; npm install --save @whi/holochain-admin-client

use-local-agent-client:
	cd tests; npm uninstall @whi/holochain-agent-client
	cd tests; npm install --save ../../holochain-agent-client-js/
use-npm-agent-client:
	cd tests; npm uninstall @whi/holochain-agent-client
	cd tests; npm install --save @whi/holochain-agent-client

use-local-backdrop:
	cd tests; npm uninstall @whi/holochain-backdrop
	cd tests; npm install --save-dev ../../node-holochain-backdrop/
use-npm-backdrop:
	cd tests; npm uninstall @whi/holochain-backdrop
	cd tests; npm install --save-dev @whi/holochain-backdrop


MOCHA_OPTS		= -t 15000
#
# Testing
#
test:			test-unit	test-integration	test-e2e
test-debug:		test-unit-debug	test-integration-debug	test-e2e-debug

test-unit:		build test-setup
	LOG_LEVEL=warn npx mocha $(MOCHA_OPTS) ./tests/unit
test-unit-debug:	build test-setup
	LOG_LEVEL=trace npx mocha $(MOCHA_OPTS) ./tests/unit

test-integration:		build test-setup
	LOG_LEVEL=warn npx mocha $(MOCHA_OPTS) ./tests/integration
test-integration-debug:		build test-setup
	LOG_LEVEL=trace npx mocha $(MOCHA_OPTS) ./tests/integration
test-integration-debug-%:	build test-setup
	LOG_LEVEL=trace npx mocha $(MOCHA_OPTS) ./tests/integration/test_$*.js

test-e2e:		prepare-package build test-setup
	LOG_LEVEL=warn npx mocha $(MOCHA_OPTS) ./tests/e2e
test-e2e-debug:		prepare-package build test-setup
	LOG_LEVEL=trace npx mocha $(MOCHA_OPTS) ./tests/e2e
test-e2e-debug-%:	prepare-package build test-setup
	LOG_LEVEL=trace npx mocha $(MOCHA_OPTS) ./tests/e2e/test_$*.js
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
	rm -f dist/*
	npx webpack
	MODE=production npx webpack
	gzip -kf dist/*.js
preview-package:	clean-files test prepare-package
	npm pack --dry-run .
create-package:		clean-files test prepare-package
	npm pack .
publish-package:	clean-files test prepare-package
	npm publish --access public .
