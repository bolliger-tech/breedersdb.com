<?php

namespace App\Model\Table;

use Cake\ORM\Association\BelongsTo;
use Cake\ORM\Association\HasMany;
use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\ORM\TableRegistry;
use Cake\Validation\Validator;
use SoftDelete\Model\Table\SoftDeleteTrait;

/**
 * Queries Model
 *
 * @property \Cake\ORM\Association\BelongsTo $QueryGroups
 *
 * @method \App\Model\Entity\Query get($primaryKey, $options = [])
 * @method \App\Model\Entity\Query newEntity($data = null, array $options = [])
 * @method \App\Model\Entity\Query[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\Query|bool save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\Query patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\Query[] patchEntities($entities, array $data, array $options = [])
 * @method \App\Model\Entity\Query findOrCreate($search, callable $callback = null, $options = [])
 *
 * @mixin \Cake\ORM\Behavior\TimestampBehavior
 */
class QueriesTable extends Table
{
    use SoftDeleteTrait;
    
    /**
     * Initialize method
     *
     * @param array $config The configuration for the Table.
     *
     * @return void
     */
    public function initialize(array $config)
    {
        parent::initialize($config);
        
        $this->table('queries');
        $this->displayField('id');
        $this->primaryKey('id');
        
        $this->addBehavior('Timestamp');
        $this->addBehavior('RulesToConditionsConvertible');
        $this->addBehavior('GetFilterData');
        $this->addBehavior('TranslateableFields');
        $this->addBehavior('MarkQuery');
        
        $this->belongsTo('QueryGroups', [
            'foreignKey' => 'query_group_id',
            'joinType'   => 'INNER'
        ]);
    }
    
    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     *
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator)
    {
        $validator
            ->integer('id')
            ->allowEmpty('id', 'create')
            ->add('id', 'unique', ['rule' => 'validateUnique', 'provider' => 'table']);
        
        $validator
            ->requirePresence('code', 'create')
            ->notEmpty('code')
            ->add('code', 'unique', ['rule' => 'validateUnique', 'provider' => 'table']);
        
        $validator
            ->allowEmpty('query');
        
        $validator
            ->allowEmpty('description');
        
        return $validator;
    }
    
    /**
     * Returns a rules checker object that will be used for validating
     * application integrity.
     *
     * @param \Cake\ORM\RulesChecker $rules The rules object to be modified.
     *
     * @return \Cake\ORM\RulesChecker
     */
    public function buildRules(RulesChecker $rules)
    {
        $rules->add($rules->isUnique(['id']));
        $rules->add($rules->isUnique(['code']));
        $rules->add($rules->existsIn(['query_group_id'], 'QueryGroups'));
        
        return $rules;
    }
    
    /**
     * Return associative array with view.field as key and its translated name as value
     * grouped by the view name.
     *
     * @param array $tables
     *
     * @return array
     */
    public function getTranslatedFieldsOf(array $tables)
    {
        $view_fields_type_map = $this->getFieldTypeMapOf($tables);
        
        $fields = array();
        foreach ($view_fields_type_map as $view => $fields_type_map) {
            foreach ($fields_type_map as $field => $type) {
                $fields[$view][$view . '.' . $field] = $this->translateFields($view . '.' . $field);
            }
        }
        
        return $fields;
    }
    
    /**
     * Return associative array with field names as keys and its type as value from given tables names
     *
     * @param array $tables
     *
     * @return array
     */
    public function getFieldTypeMapOf(array $tables)
    {
        $fields = array();
        foreach ($tables as $table_name) {
            $table               = TableRegistry::get($table_name);
            $fields[$table_name] = $table->schema()->typeMap();
        }
        
        return $fields;
    }
    
    /**
     * Return patched entity with the query data merged as json into the query field.
     * The other fields are patched normally.
     *
     * @param $entity
     * @param $request
     *
     * @return mixed
     */
    public function patchEntityWithQueryData($entity, $request)
    {
        $data['root_view'] = $request['root_view'];
        unset($request['root_view']);
        
        $views = array_keys($this->getViewNames());
        $query = array();
        
        foreach ($views as $view) {
            $query[$view] = $request[$view];
            unset($request[$view]);
        }
        
        $data['fields'] = $query;
        
        $data['where'] = $request['where_query'];
        unset($request['where_query']);
        
        $request['query'] = json_encode($data);
        
        return $this->patchEntity($entity, $request);
    }
    
    /**
     * Return associative array with names of the views to query as keys and its translated names as values
     *
     * @return array
     */
    public function getViewNames()
    {
        return [
            'BatchesView'       => __('Batches'),
            'CrossingsView'     => __('Crossings'),
            'MarksView'         => __('Marks'),
            'MotherTreesView'   => __('Mother Trees'),
            'ScionsBundlesView' => __('Scions Bundles'),
            'TreesView'         => __('Trees'),
            'VarietiesView'     => __('Varieties'),
        ];
    }
    
    /**
     * Return columns from given query data with dot noted key and translated value
     *
     * The $query_data must be a stdClass with at least the properties:
     * - fields : result of the query builder field selection as stdClass
     *
     * @param $query_data
     *
     * @return array
     */
    public function getViewQueryColumns($query_data)
    {
        $tmp = $this->getActiveFields($query_data);
        $tmp = $this->_getTranslatedFieldsFromList($tmp);
        
        // get recursively dot notated keys
        $return = [];
        foreach ($tmp as $key => $value) {
            $dot_key          = $this->_getDottedFieldPath($key);
            $return[$dot_key] = $value;
        }
        
        return $return;
    }
    
    /**
     * Return active fields from given query data.
     *
     * The $query_data must be a stdClass with at least the properties:
     * - fields : result of the query builder field selection as stdClass
     *
     * @param $query_data
     *
     * @return array
     */
    public function getActiveFields($query_data)
    {
        return $this->_parseQuery($query_data->fields, 'field');
    }
    
    /**
     * Return array with fields or tables
     *
     * @param \stdClass $query
     * @param string $type
     *
     * @return array
     */
    private function _parseQuery(\stdClass $query, string $type): array
    {
        $return = array();
        $views  = array_keys($this->getViewNames());
        
        foreach ($views as $view) {
            foreach ($query->$view as $key => $value) {
                if ($value) {
                    if ('table' == $type) {
                        // tables
                        $return[] = $view;
                    } else {
                        // fields
                        $return[] = $view . '.' . $key;
                    }
                }
            }
        }
        
        return array_unique($return);
    }
    
    /**
     * Return associative array with view.field as key and its translated name as value.
     *
     * @param array $list
     *
     * @return array
     */
    private function _getTranslatedFieldsFromList(array $list)
    {
        $fields = [];
        foreach ($list as $item) {
            $fields[$item] = $this->translateFields($item);
        }
        
        return $fields;
    }
    
    /**
     * Return fully qualified dot path of given key.
     * IMPORTANT: make sure this method gets called AFTER $this->buildViewQuery()
     *
     * @param string $key
     *
     * @return string
     */
    private function _getDottedFieldPath(string $key): string
    {
        $table = explode('.', $key)[0];
        foreach ($this->viewQueryAssociations as $association) {
            $path = $this->viewQueryRoot . '.' . $association;
            $pos  = strpos($path, $table);
            if ($pos) {
                return substr($path, 0, $pos) . $key;
            }
        }
        
        return $key;
    }
    
    /**
     * Return query from given query data.
     *
     * The $query_data must be a stdClass with at least the properties:
     * - root_view : the FROM table
     * - fields : result of the query builder field selection as stdClass
     *
     * The 'where' property is optional.
     * If present the original JSON from the where query builder is expected.
     * (@see http://querybuilder.js.org/)
     *
     * @param $query_data
     *
     * @return Query
     */
    public function buildViewQuery($query_data)
    {
        $tables = $this->_parseQuery($query_data->fields, 'table');
        
        // keep in memory for later use
        $this->viewQueryRoot         = $query_data->root_view;
        $associations                = $this->_buildAssociationsForContainStatement($this->viewQueryRoot, $tables);
        $this->viewQueryAssociations = $associations;
        
        $joins = $this->_buildJoinArrays($associations);
        
        $where_rules = json_decode($this->getWhereRules($query_data));
        $conditions  = $this->convertRulesetToConditions($where_rules);
        
        $rootTable = TableRegistry::get($this->viewQueryRoot);
        $query     = $rootTable
            ->find('all')
            ->contain($associations)
            ->join($joins)
            ->where($conditions);
        
        return $query;
    }
    
    /**
     * Return 1-dim array with association paths of $tables in dot notation starting from root.
     *
     * @param string $root
     * @param array $tables
     *
     * @return array
     */
    private function _buildAssociationsForContainStatement(string $root, array $tables)
    {
        $associations = $this->_getAssociationsRecursive($root, $tables);
        
        if (empty($associations)) {
            return [];
        }
        
        return $this->_getDottedArrayPath($associations);
    }
    
    /**
     * Return nested array of associations of all $tables starting at the root.
     * The key represent the association. Leafs have null values.
     *
     * @param string $root
     * @param array $tables
     *
     * @return array|null
     */
    private function _getAssociationsRecursive(string $root, array $tables)
    {
        $tables = array_diff($tables, [$root]);
        
        if (empty($tables)) {
            return null;
        }
        
        $associations = array();
        $return       = array();
        
        foreach ($this->getAssociationsOf($root) as $association) {
            $key = array_search($association, $tables);
            if (false !== $key) {
                $associations[] = $tables[$key];
                unset($tables[$key]);
            }
        }
        
        if (empty($associations)) {
            return null;
        }
        
        foreach ($associations as $key => $association) {
            $return[$association] = $this->_getAssociationsRecursive($association, $tables);
        }
        
        return $return;
    }
    
    /**
     * Return array of associations from given table
     *
     * @param string $table_name
     * @param boolean $hasManyOnly only return has many associations
     *
     * @return array of associations
     */
    public function getAssociationsOf(string $table_name, $hasManyOnly = false)
    {
        $associated = array();
        
        $tmp = TableRegistry::get($table_name);
        $has = $tmp->associations();
        
        $tables = array();
        foreach ($has as $table => $properties) {
            $tables[] = $table;
        }
        
        if ($hasManyOnly) {
            foreach ($tables as $table) {
                if ( ! $has->get($table) instanceof \Cake\ORM\Association\HasMany) {
                    unset($tables[array_search($table, $tables)]);
                }
            }
        }
        
        foreach ($tables as $table) {
            $associated[] = $has->get($table)->name();
        }
        
        return $associated;
    }
    
    /**
     * Recursive walk array and build a dot path of its keys.
     *
     * @param $array
     *
     * @return array
     */
    private function _getDottedArrayPath($array): array
    {
        $return = [];
        foreach ($array as $base => $child) {
            if ( ! is_array($child)) {
                $return[] = $base;
            } else {
                $return[] = trim($base . '.' . implode('.', $this->_getDottedArrayPath($child)), '.');
            }
        }
        
        return $return;
    }
    
    /**
     * Return an array ready for the cake ORMs join method from given array with a dot noted list of associations
     *
     * @param array $associations
     *
     * @return array
     */
    private function _buildJoinArrays(array $associations)
    {
        
        $array = array();
        foreach ($associations as $els) {
            $rootTable = TableRegistry::get($this->viewQueryRoot);
            foreach (explode('.', $els) as $tableName) {
                $table             = TableRegistry::get($tableName);
                $rootAssociation   = $rootTable->associations()->get($table->alias());
                $tableAssociation  = $table->associations()->get($rootTable->alias());
                $array[$tableName] = [
                    'table'      => $table->table(),
                    'conditions' => $this->_getAssociationConditions($rootAssociation, $tableAssociation),
                    'type'       => $rootAssociation->joinType()
                ];
                $rootTable         = $table;
            }
        }
        
        return $array;
    }
    
    /**
     * Return the SQL join condition from given table associations to join
     *
     * @param $associationA
     * @param $associationB
     *
     * @return string
     * @throws \Exception
     */
    private function _getAssociationConditions($associationA, $associationB)
    {
        if ($associationA instanceof BelongsTo && $associationB instanceof HasMany) {
            $leaf = $associationA;
            $root = $associationB;
        }
        if ($associationA instanceof HasMany && $associationB instanceof BelongsTo) {
            $leaf = $associationB;
            $root = $associationA;
        }
        
        if (empty($leaf)||empty($root)) {
            throw new \Exception("Type of association not implemented");
        }
        
        return $root->name().'.'.$root->foreignKey().' = '.$leaf->name().'.'.$leaf->bindingKey();
    }
    
    /**
     * Return the where data as JSON or null
     *
     * @param $query_data
     *
     * @return null
     */
    public function getWhereRules(\stdClass $query_data)
    {
        if (property_exists($query_data, 'where')) {
            return $query_data->where;
        }
        
        return json_encode(null);
    }
    
    /**
     * Return active tables from given query data.
     *
     * The $query_data must be a stdClass with at least the properties:
     * - fields : result of the query builder field selection as stdClass
     *
     * @param $query_data
     *
     * @return array
     */
    public function getActiveViewTables(\stdClass $query_data)
    {
        return $this->_parseQuery($query_data->fields, 'table');
    }
}
