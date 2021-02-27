<?php

namespace App\Generator;

/**
 * Batches generator.
 */
class BatchesGenerator {

    public function generate( int $count ) {
        $crossingsTable = \Cake\ORM\TableRegistry::getTableLocator()->get( 'Crossings' );
        $crossings      = $crossingsTable->find()->toArray();

        $faker = \Faker\Factory::create();
        $data  = [];
        for ( $i = 0; $i < $count; $i ++ ) {
            $crossing = $faker->randomElement( $crossings );

            $code     = sprintf( '%02d%s', $faker->numberBetween( 16, 25 ), $faker->randomElement( [
                'A',
                'B',
                'C'
            ] ) );

            $data[] = [
                'code'                 => $code,
                'date_sowed'           => $faker->dateTimeBetween( '-1 year', '-9 months' )->format( 'Y-m-d' ),
                'numb_seeds_sowed'     => $faker->numberBetween( 50, 100 ),
                'numb_sprouts_grown'   => $faker->numberBetween( 25, 50 ),
                'seed_tray'            => $faker->numberBetween( 12, 37 ),
                'date_planted'         => $faker->dateTimeBetween( '-9 year', '-6 months' )->format( 'Y-m-d' ),
                'numb_sprouts_planted' => $faker->numberBetween( 1, 25 ),
                'patch'                => $faker->word(),
                'note'                 => $faker->sentence(),
                'crossing_id'          => $crossing->id,
                'deleted'              => null,
                'created'              => date( 'Y-m-d H:i:s' ),
                'modified'             => date( 'Y-m-d H:i:s' ),
                'crossing_batch'       => $crossing->code . '.' . $code,
            ];
        }

        return $data;
    }
}
