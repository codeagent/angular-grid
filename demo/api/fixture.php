<?php
use \Faker\Factory;
use \Faker\Generator;

class Fixture
{
  /**
   * @var array
   */
  protected $config;

  /**
   * Generator
   * @var Generator
   */
  protected $faker;

  public function __construct($config = 'config.php')
  {
    $this->config = include ($config);
    $this->faker = Factory::create();
  }

  public function load()
  {
    $total = (int)$this->config['rows'];
    $rows = [];

    $statuses = [Model::STATUS_APPROVED, Model::STATUS_DISABLED];
    $roles = [Model::ROLE_USER, Model::ROLE_MODERATOR, Model::ROLE_ADMIN];

    while($total > 0)
    {
      $rows[] = [
        $this->faker->firstName,
        $this->faker->lastName,
        $this->faker->email,
        $statuses[array_rand($statuses)],
        time() - rand(0, 30 * 24 * 3300),
        time() - rand(0, 30 * 24 * 3300),
        rand(1, 10),
        $this->faker->imageUrl(32, 32, 'cats'),
        $roles[array_rand($roles)]
      ];
      $total--;
    }

    $model = new Model();
    $model->truncate();
    return $model->batchInsert(['firstname', 'lastname', 'email', 'status', 'updated_at', 'created_at', 'updated_by', 'avatar', 'role'], $rows);
  }
}
