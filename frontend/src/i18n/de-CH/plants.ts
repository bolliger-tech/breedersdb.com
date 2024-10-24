export const plants = {
  title: 'Pflanze | Pflanzen',
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
    dateLabeled: 'Ettiketierungsdatum',
    plantGroup: 'Gruppe',
    plantRow: 'Zeile',
    grafting: 'Veredelung',
    rootstock: 'Unterlage'
  },
  errors: {
    labelId: '\nEtiketten-ID darf nur aus Zahlen bestehen (max. 8 Ziffern). Wenn die Pflanze eliminiert wurde, muss der Etiketten-ID ein # vorangestellt werden',
    distancePlantRowStart: 'Entfernung zum Zeilenanfang muss eine positive Zahl sein',
    labelIdQueryError: 'Es konnte nicht überprüft werden, ob die Etiketten-ID einmalig ist',
    labelIdNextFree: 'Etiketten-ID wird bereits verwendet. Die nächste freie Etiketten-ID ist {labelId}',
    labelIdNotUnique: 'Etiketten-ID wird bereits verwendet. Die nächste freie Etiketten-ID ist unbekannt.',
    labelIdinvalid: 'Ungültige Etiketten-ID',
    eliminatedNotAllowed: 'Eliminierte Pflanzen können hier nicht verwendet werden',
    labelIdNotFound: 'Die Pflanze {labelId} wurde nicht gefunden'
  },
  hints: {
    labelId: 'Erforderlich. Nummer (max. 8 Ziffern). Mit # vorangestellt, wenn die Pflanze eliminiert wurde',
    distancePlantRowStart: 'Meter',
    dateEliminatedTrue: 'Das Hinzufügen eines Eliminierungsdatums wird diese Pflanze deaktivieren und die der Etiketten-ID eine # voranstellen',
    dateEliminatedFalse: 'Das Entfernen des Eliminierungsdatums wird diese Pflanze aktivieren und die vorangestellte # der Etiketten-ID entfernen'
  },
  eliminate: 'Eliminieren',
  eliminateConfirmation: 'Die Eliminierung zügelt diese Pflanze auf die Liste der deaktivierten Pflanzen, der Etiketten-ID wird eine # vorangestellt, und es wird nicht mehr möglich sein, dieser Pflanze Attribute hinzuzufügen. Möchtest du diese Pflanze wirklich eliminieren?',
  plantSelect: 'Pflanze (Etiketten-ID)'
};