// noinspection SpellCheckingInspection
export default {
  marks: {
    title: 'Bewertungen',
    selectForm: {
      title: 'Formular auswählen',
      tab: 'Formular'
    },
    setMeta: {
      title: 'Meta-Daten festlegen',
      tab: 'Meta',
      author: 'Autor',
      authorHint: 'Der Name der Person, die bewertet.',
      date: 'Datum',
      dateHint: 'Das Datum der Bewertung.'
    },
    selectTree: {
      title: 'Baum auswählen',
      tab: 'Baum',
      scanQrCode: 'QR-Code scannen',
      manualEntry: 'Publicid eingeben'
    },
    markTree: {
      title: 'Baum bewerten',
      tab: 'Bewerten',
      missingDataError: 'Fehlende Daten.',
      setMeta: 'Meta-Daten hinzufügen',
      selectTree: 'Baum auswählen',
      selectForm: 'Formular auswählen',
      saved: 'Bewertungen gespeichert.',
      addProperty: 'Eigenschaft hinzufügen',
      selectProperty: 'Eigenschaft auswählen',
      propertyAlreadyExists: 'Eigenschaft {property} kann kein zweites Mal hinzugefügt werden.'
    }
  },
  trees: {
    publicid: 'Publicid',
    convar: 'Convar',
    datePlanted: 'Date planted',
    dateEliminated: 'Date eliminated',
    experimentSite: 'Experiment site',
    row: 'Row',
    offset: 'Offset',
    note: 'Note'
  },
  varieties: {
    officialName: 'Official name',
    acronym: 'Acronym',
    plantBreeder: 'Plant breeder',
    registration: 'Registration',
    description: 'Description'
  },
  batches: {
    dateSowed: 'Date sowed',
    numbSeedsSowed: 'Number of seeds sowed',
    numbSproutsGrown: 'Number of sprouts grown',
    seedTray: 'Seed tray',
    datePlanted: 'Date planted',
    numbSproutsPlanted: 'Number of sprouts planted',
    patch: 'Patch',
    note: 'Note'
  },
  queries: {
    title: 'Abfragen',
    query: 'Abfrage',
    baseTable: 'Basis',
    crossings: 'Kreuzungen',
    batches: 'Lose',
    varieties: 'Sorten',
    trees: 'Bäume',
    motherTrees: 'Mutterbäume',
    scionsBundles: 'Reiserbündel',
    marks: 'Bewertungen',
    Marks: 'Bewertungen',
    defaultFilter: 'Filterkriterien',
    batchFilter: 'Filterkriterien um die Lose auszuwählen',
    varietyFilter: 'Filterkriterien um die Sorten auszuwählen',
    treeFilter: 'Filterkreiterien um die Bäume auszuwählen',
    markFilter: 'Filterkriterien um die Bewertungen auszuwählen',
    noFilter: 'Keine Filterkriterien definiert. Alle {entity} werden ausgewählt. Klicke auf die Plus-Schaltfläche unten, um Filterkriterien hinzuzufügen.',
    simplifiable: 'Unnötige Komplexität erkannt.',
    simplify: 'Filter vereinfachen',
    invalid: 'Ungültige Filterregeln. Korrigiere oder lösche sie.',
    valid: 'Glückwunsch, alle Regeln sind gültig.',
    filter: {
      column: 'Spalte',
      comparator: 'Operation',
      criteria: 'Kriterium',
      equals: 'ist gleich',
      notEquals: 'ist nicht gleich',
      less: 'kleiner als',
      lessOrEqual: 'kleiner oder gleich',
      greater: 'grösser als',
      greaterOrEqual: 'grösser oder gleich',
      startsWith: 'beginnt mit',
      startsNotWith: 'beginnt nicht mit',
      contains: 'enthält',
      notContains: 'enthält nicht',
      endsWith: 'endet mit',
      notEndsWith: 'endet nicht mit',
      empty: 'ist leer',
      notEmpty: 'ist nicht leer',
      hasPhoto: 'hat Foto',
      isTrue: 'ist wahr',
      isFalse: 'ist falsch',
      add: 'Hinzufügen',
      andFilter: 'und Kriterien',
      orFilter: 'oder Kriterien',
      and: 'und',
      or: 'oder',
      noResults: 'Keine Ergebnisse.'
    },
    invalidNoResults: 'Invalid filter rules. Rectify or delete them to get results.',
    results: 'Ergebnisse',
    addColumn: 'Spalte hinzufügen',
    debugShow: 'Show debug info',
    debugHide: 'Hide debug info',
    altPhoto: 'Photo taken {date} by {author}',
    photo: 'Photo',
    downloadPhoto: 'Download photo'
  },
  general: {
    search: 'Suchen',
    loading: 'Laden...',
    retry: 'Wiederholen',
    failedToLoadData: 'Fehler beim Laden der Daten.',
    failedToSaveData: 'Fehler beim Speichern der Daten.',
    refreshList: 'Liste aktualisieren',
    next: 'Nächste',
    dismiss: 'Verwerfen',
    navigation: 'Navigation',
    selected: 'ausgewählt',
    form: {
      required: 'Feld ist erforderlich',
      max255chars: 'Max. 255 Zeichen erlaubt',
      save: 'Speichern'
    }
  },
  components: {
    util: {
      errorBanner: {
        dismiss: 'verwerfen'
      },
      treeCard: {
        scanBtnLabel: 'Scannen',
        tree: 'Baum',
        printBtnLabel: 'Drucken',
        printTitle: 'Etikette drucken',
        printDesc: 'Wähle normal um ein Etikett mit Publicid und Convar zu drucken oder anonym um das Convar wegzulassen.',
        printRegular: 'Normal',
        printAnonymous: 'Anonymisiert',
        windowError: 'Öffnen des Druckfensters fehlgeschlagen. Werden Popups blockiert?',
        noTree: 'Bitte Baum scannen'
      },
      codeScanner: {
        permissionRequest: 'Zugriff auf den Video-Stream nicht möglich. Bitte die Berechtigungsanfrage bestätigen.',
        loadingMessage: '⌛ Video wird geladen...'
      },
      list: {
        listMetaFiltered: 'Gefilterte Liste. Zeige {showing} von {total} Elementen.',
        listMetaUnfiltered: '{total} Elemente',
        nothingFound: 'Nichts gefunden'
      }
    }
  },
  navigation: {
    markTrees: {
      title: 'Baum bewerten',
      caption: 'Scanne Bäume und bewerte sie.'
    },
    trees: {
      title: 'Bäume',
      caption: 'Liste aller Bäume.'
    },
    queries: {
      title: 'Abfragen',
      caption: 'Datenbank durchsuchen.'
    }
  }
};