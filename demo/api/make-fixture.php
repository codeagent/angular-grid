<?php
include __DIR__ . "/../vendor/autoload.php";

$fixture = new Fixture();
$total = $fixture->load();

if($total === false)
{
  echo "Something was going wrong...\n";
}
else
{
  echo "Success. {$total} records were affected.\n";
}
