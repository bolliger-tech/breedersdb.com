<table cellpadding="0" cellspacing="0">
<thead>
    <tr>
        <th scope="col" class="id"><?= $this->Paginator->sort('id') ?></th>
        <th scope="col"><?= $this->Paginator->sort('publicid') ?></th>
        <th scope="col"><?= $this->Paginator->sort('convar') ?></th>
        <th scope="col"><?= $this->Paginator->sort('row') ?></th>
        <th scope="col"><?= $this->Paginator->sort('offset') ?></th>
        <th scope="col"><?= $this->Paginator->sort('note') ?></th>
        <th scope="col"><?= $this->Paginator->sort('eliminated') ?></th>
        <th scope="col"><?= $this->Paginator->sort('modified') ?></th>
        <th scope="col" class="actions"><?= __('Actions') ?></th>
    </tr>
</thead>
<tbody>
    <?php foreach ($trees as $tree): ?>
    <tr>
        <td class="id"><?= $this->Number->format($tree->id) ?></td>
        <td><?= h($tree->publicid) ?></td>
        <td><?= $tree->has('Convar') ? $this->Html->link($tree->convar, ['controller' => 'Varieties', 'action' => 'view', $tree->variety->id]) : '' ?></td>
        <td><?= $tree->has('row') ? $this->Html->link($tree->row->id, ['controller' => 'Rows', 'action' => 'view', $tree->row->id]) : '' ?></td>
        <td><?= $this->Number->format($tree->offset) ?></td>
        <td><?= $tree->note ? $this->Html->link(__('Read'), ['action' => 'view', $tree->id]) : '' ?></td>
        <td><?= $tree->date_eliminated ? __('eliminated') : '' ?></td>
        <td><?= h($tree->modified) ?></td>
        <td class="actions">
            <?= $this->Html->link(__('View'), ['action' => 'view', $tree->id]) ?>
            <?= $this->Html->link(__('Edit'), ['action' => 'edit', $tree->id]) ?>
            <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $tree->id], ['confirm' => __('Are you sure you want to delete "{0}" (id: {1})?', $tree->publicid, $tree->id)]) ?>
        </td>
    </tr>
    <?php endforeach; ?>
</tbody>
</table>
<div class="paginator">
    <ul class="pagination">
        <?= $this->Paginator->first('<< ' . __('first')) ?>
        <?= $this->Paginator->prev('< ' . __('previous')) ?>
        <?= $this->Paginator->numbers() ?>
        <?= $this->Paginator->next(__('next') . ' >') ?>
        <?= $this->Paginator->last(__('last') . ' >>') ?>
    </ul>
    <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
</div>