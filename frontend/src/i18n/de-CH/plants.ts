export const plants = {
  title: 'Pflanze | Pflanzen',
  active: 'Aktive Pflanzen',
  eliminated: 'Eliminierte Pflanzen',
  searchPlaceholder: 'Suche nach Etiketten-ID oder Cultivar',
  selectSearchNoOption: 'Tippe um nach Etiketten-ID zu suchen',
  fields: {
    labelId: 'Etiketten-ID',
    cultivarName: 'Cultivar',
    groupName: 'Gruppe',
    serialInPlantRow: 'Nummer in Zeile',
    distancePlantRowStart: 'Entfernung zu Zeilenbeginn',
    dateGrafted: 'Veredelungsdatum',
    datePlanted: 'Pflanzdatum',
    dateEliminated: 'Eliminierungsdatum',
    dateLabeled: 'Etikettierungsdatum',
    plantGroup: 'Gruppe',
    plantRow: 'Zeile',
    grafting: 'Veredelung',
    rootstock: 'Unterlage',
    plantId: 'Pflanzen-ID',
  },
  errors: {
    labelId:
      '\nEtiketten-ID darf nur aus Zahlen bestehen (max. 8 Ziffern). Wenn die Pflanze eliminiert wurde, muss der Etiketten-ID ein # vorangestellt werden',
    distancePlantRowStart:
      'Entfernung zum Zeilenanfang muss eine positive Zahl sein',
    labelIdQueryError:
      'Es konnte nicht überprüft werden, ob die Etiketten-ID einmalig ist',
    labelIdNextFree:
      'Etiketten-ID wird bereits verwendet. Die nächste freie Etiketten-ID ist {labelId}',
    labelIdNotUnique:
      'Etiketten-ID wird bereits verwendet. Die nächste freie Etiketten-ID ist unbekannt.',
    labelIdinvalid: 'Ungültige Etiketten-ID',
    eliminatedNotAllowed:
      'Eliminierte Pflanzen können hier nicht verwendet werden',
    labelIdNotFound: 'Die Pflanze {labelId} wurde nicht gefunden',
  },
  hints: {
    labelId:
      'Erforderlich. Nummer (max. 8 Ziffern). Mit # vorangestellt, wenn die Pflanze eliminiert wurde',
    distancePlantRowStart: 'Meter',
    dateEliminatedTrue:
      'Das Hinzufügen eines Eliminierungsdatums wird diese Pflanze deaktivieren und die der Etiketten-ID eine # voranstellen',
    dateEliminatedFalse:
      'Das Entfernen des Eliminierungsdatums wird diese Pflanze aktivieren und die vorangestellte # der Etiketten-ID entfernen',
  },
  eliminate: 'Eliminieren',
  eliminateConfirmation:
    'Die Eliminierung verschiebt diese Pflanze auf die Liste der deaktivierten Pflanzen, der Etiketten-ID wird eine # vorangestellt, und es wird nicht mehr möglich sein, dieser Pflanze Attribute hinzuzufügen. Möchtest du diese Pflanze wirklich eliminieren?',
  plantSelect: 'Pflanze (Etiketten-ID)',
  eliminatePlant: 'Pflanze eliminieren',
  eliminatePlantSuccess: 'Pflanze {labelId} eliminiert',
  eliminatePlantError:
    'Fehler beim Eliminieren der Pflanze. Bitte versuche es erneut.',
};
