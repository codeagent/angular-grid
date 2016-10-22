<?php
class Model
{
  const STATUS_APPROVED = 1;
  const STATUS_DISABLED = 0;

  const ROLE_USER = 'user';
  const ROLE_MODERATOR = 'moderator';
  const ROLE_ADMIN = 'admin';

  const BATCH_SIZE = 20;  // records per one insert

  protected $pdo;
  protected $config;

  protected $where;
  protected $sort;
  protected $limit;
  protected $offset;

  public function __construct($config = 'config.php')
  {
    $this->config = include ($config);
    $this->pdo = new PDO($this->config['dns']);
  }

  public function sort(array $sort = array())
  {
    $s = [];
    foreach($sort as $field => $order)
    {
      $s[] = "`{$field}` " . strtoupper($order);
    }
    $this->sort = implode(", ", $s);
    return $this;
  }

  public function limit($limit)
  {
    $this->limit = $limit;
    return $this;
  }

  public function offset($offset)
  {
    $this->offset = $offset;
    return $this;
  }

	public function where($where = [])
	{
    $this->where = $where;
    return $this;
	}

  public function all($type = PDO::FETCH_ASSOC)
  {
    try
    {
      $sql = $this->buildQuery();
      $statement = $this->pdo->prepare($sql);
      $statement->execute();

      return $statement->fetchAll($type);

    }
    catch(PDOException $e)
    {
      echo $e->getMessage();
      return [];
    }
  }

  public function count()
  {
    try
    {
      $sql = $this->buildQuery(true);
      $statement = $this->pdo->prepare($sql);
      $statement->execute();

      return $statement->fetchColumn();

    }
    catch(PDOException $e)
    {
      echo $e->getMessage();
      return -1;
    }
  }

  protected function buildQuery($forCount = false)
  {
    if(!$forCount)
      $sql = 'SELECT * FROM `user`';
    else
      $sql = 'SELECT COUNT(*) FROM `user`';

   if(is_array($this->where)) {
      if(isset($this->where['status'])) {
         $status = $this->where['status'];
         $this->where = array_filter($this->where);
         $this->where['status'] = $status;
      }
      else
         $this->where = array_filter($this->where);
   }


    if(!empty($this->where))
    {
      $where = [];
      foreach(['firstname', 'lastname', 'email', 'role', 'avatar'] as $field)
        if(isset($this->where[$field]))
          $where[] = "`{$field}` LIKE '%{$this->where[$field]}%'";

      foreach(['id', 'status', 'updated_by'] as $field)
        if(isset($this->where[$field]))
          $where[] = "`{$field}`= {$this->where[$field]}";

      foreach(['updated_at', 'created_at'] as $field) {
          if(isset($this->where[$field])) {
             $where[] = "`{$field}` >= {$this->where[$field]['from']}";
             $where[] = "`{$field}` <= {$this->where[$field]['to']}";
          }         
      }

      $sql .= " WHERE " . implode($where, " AND ");
    }

    if($this->sort)
      $sql .= " ORDER BY {$this->sort}";

    if(!$forCount && $this->limit)
      $sql .= " LIMIT {$this->limit}";

    if(!$forCount && $this->offset)
      $sql .= " OFFSET {$this->offset}";

    return $sql;
  }


  public function truncate()
  {
    try
    {
      $sql = "DELETE FROM `user`";
      return $this->pdo->exec($sql);
    }
    catch (Exception $e)
    {
      return false;
    }
  }

  public function batchInsert($fields, $records = array())
  {
    $rowsAffected = 0;
    while(count($records))
    {
      $batch = array_slice($records, 0, self::BATCH_SIZE);
      $sql = "INSERT INTO `user` (`" . implode("`, `", $fields) . "`) VALUES \n";
      $values = [];

      foreach($batch as $row)
      {
        foreach($row as $id => $value)
        {
          if(is_null($value))
            $row[$id] = 'NULL';
          elseif(is_string($value))
            $row[$id] = "'{$value}'";
        }

        $values[] = "(" . implode(", ", $row) . ")";
      }
      $sql .=  implode(", \n", $values);

      try
      {
          $rowsAffected += $this->pdo->exec($sql);
      }
      catch (Exception $e) {
        return false;
      }

      $records = array_slice($records, self::BATCH_SIZE);
    }

    return $rowsAffected;
  }
}
