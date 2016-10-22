<?php
include __DIR__ . "/../../vendor/autoload.php";

sleep(1);
echo (new Controller($_REQUEST))->run() . "\n";
