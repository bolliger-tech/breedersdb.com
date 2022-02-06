<?php

use Migrations\TestSuite\Migrator;

/**
 * Test runner bootstrap.
 *
 * Add additional configuration/setup your application needs when running
 * unit tests in this file.
 */
require dirname(__DIR__) . '/vendor/autoload.php';

require dirname(__DIR__) . '/config/bootstrap.php';

$_SERVER['PHP_SELF'] = '/';

// Fixate sessionid early on, as php7.2+
// does not allow the sessionid to be set after stdout
// has been written to.
// @see https://github.com/cakephp/cakephp/issues/14085
session_id('cli');

// Setup Database
$views = [
    'batches_view',
    'crossings_view',
    'marks_view',
    'mother_trees_view',
    'scions_bundles_view',
    'trees_view',
    'varieties_view'
];

$migrator = new Migrator();
try {
    $migrator->truncate('test', $views);
    $migrator->run(['connection' => 'test', 'skip' => $views]);
} catch (PDOException $e) {
    // the migrator doesn't handle views well
    // so we can ignore errors of views
    if (! str_contains($e->getMessage(), "_view' doesn't exist")) {
        throw $e;
    }
}
