<?php
class Controller
{
  public $sortParam = 'sort';
  public $pageParam = 'page';
  public $pageSizeParam = 'page-size';
  public $filterParam = 'filter';
  public $totalItemsHeader = 'X-Pagination-Total-Count';

  public $defaultPage = 1;
  public $defaultPageSize = 20;
  public $defaultSort = [];

  protected $params;

  public function __construct($params)
  {
    $this->params = $params;
  }

  public function run()
  {
    $model = new Model();
    if(isset($this->params[$this->filterParam]))
      $model->where($this->params[$this->filterParam]);

    if(isset($this->params[$this->sortParam]))
      $model->sort($this->params[$this->sortParam]);
    else
      $model->sort($this->defaultSort);

    $page = isset($this->params[$this->pageParam]) ? (int)$this->params[$this->pageParam] : $this->defaultPage;
    $page = max(0, $page);
    $size = isset($this->params[$this->pageSizeParam]) ? (int)$this->params[$this->pageSizeParam] : $this->defaultPageSize;

    $model
      ->limit($size)
      ->offset(($page - 1) * $size);

      header("Content-Type: application/json; charset=utf-8");
      header("{$this->totalItemsHeader}: {$model->count()}");
      echo json_encode($model->all());
      die();
  }
}
