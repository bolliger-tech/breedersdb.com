<table>
    <thead>
    <tr>
        <th scope="col" class="id"><?= $this->Paginator->sort( 'id' ) ?></th>
        <th scope="col"><?= $this->Paginator->sort( 'name' ) ?></th>
        <th scope="col"><?= $this->Paginator->sort( 'description' ) ?></th>
        <th scope="col"><?= $this->Paginator->sort( 'modified' ) ?></th>
        <th scope="col" class="actions noprint"><?= __( 'Actions' ) ?></th>
    </tr>
    </thead>
    <tbody>
	<?php foreach ( $markForms as $markForm ): ?>
        <tr>
            <td class="id"><?= $this->Number->format( $markForm->id ) ?></td>
            <td><?= h( $markForm->name ) ?></td>
            <td><?= $markForm->description ? $this->Html->link( __( 'Read' ),
					[ 'action' => 'view', $markForm->id ] ) : '' ?></td>
            <td><?= h( $this->LocalizedTime->getUserTime( $markForm->modified ) ) ?></td>
            <td class="actions noprint">
				<?= $this->Html->link( '<i class="fa fa-eye view-icon" aria-hidden="true"></i>',
					[ 'action' => 'view', $markForm->id ], [ 'escapeTitle' => false, 'alt' => __( 'View' ) ] ) ?>
				<?= $this->Html->link( '<i class="fa fa-pencil edit-icon" aria-hidden="true"></i>',
					[ 'action' => 'edit', $markForm->id ], [ 'escapeTitle' => false, 'alt' => __( 'Edit' ) ] ) ?>
				<?= $this->Form->postLink( '<i class="fa fa-trash-o delete-icon" aria-hidden="true"></i>',
					[ 'action' => 'delete', $markForm->id ], [
						'escapeTitle' => false,
						'alt'         => __( 'Delete' ),
						'confirm'     => __( 'Are you sure you want to delete "{0}" (id: {1})?', $markForm->name,
							$markForm->id )
					] ) ?>
            </td>
        </tr>
	<?php endforeach; ?>
    </tbody>
</table>
<div class="paginator">
    <ul class="pagination">
		<?= $this->Paginator->first( '<< ' . __( 'first' ) ) ?>
		<?= $this->Paginator->prev( '< ' . __( 'previous' ) ) ?>
		<?= $this->Paginator->numbers() ?>
		<?= $this->Paginator->next( __( 'next' ) . ' >' ) ?>
		<?= $this->Paginator->last( __( 'last' ) . ' >>' ) ?>
    </ul>
    <p><?= $this->Paginator->counter( __( 'Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total' ) ) ?></p>
</div>
