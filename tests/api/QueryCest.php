<?php
use \ApiTester;

class QueryCest
{
    // tests
    public function testCondition(ApiTester $I)
    {
      $I->sendGET('/', ['filter' => ['role' => 'admin']]);
  		$I->seeResponseCodeIs(200);
  		$I->seeHttpHeader('X-Pagination-Total-Count', 129);

      $I->sendGET('/', ['filter' => ['role' => 'admin', 'created_from' => 1443327587, 'created_to' => 1443724799]]);
  		$I->seeResponseCodeIs(200);
  		$I->seeHttpHeader('X-Pagination-Total-Count', 27);
    }

    public function testOrder(ApiTester $I)
    {
        $I->sendGET('/', ['sort' => ['created_at' => SORT_DESC, 'id' => SORT_ASC]]);
        $I->seeResponseCodeIs(200);
        $first = (int)$I->grabDataFromResponseByJsonPath('$[0].id')[0];
        $second = (int)$I->grabDataFromResponseByJsonPath('$[1].id')[0];
        $I->assertEquals(222, $first);
        $I->assertEquals(296, $second);
    }

    public function testPagination(ApiTester $I)
    {
      $I->sendGET('/', ['page-size' => 5]);
      $I->seeResponseCodeIs(200);
      $I->seeHttpHeader('X-Pagination-Total-Count', 401);

      $I->sendGET('/', ['page-size' => 5, 'page' => 2, 'sort' => ['id' => SORT_ASC]]);
      $I->seeResponseCodeIs(200);
      $I->seeHttpHeader('X-Pagination-Total-Count', 401);
      $first = (int)$I->grabDataFromResponseByJsonPath('$[0].id')[0];
      $last = (int)$I->grabDataFromResponseByJsonPath('$[4].id')[0];
      $I->assertEquals(6, $first);
      $I->assertEquals(10, $last);
    }
}
