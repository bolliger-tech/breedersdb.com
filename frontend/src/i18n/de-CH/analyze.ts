export const analyze = {
  title: '{entity} analysieren',
  header: {
    new: 'Neue Analyse',
    more: 'Mehr',
    duplicate: 'Duplizieren',
    showExplanation: 'Filter erklären',
    hideExplanation: 'Erklärungen ausblenden',
    analysis: 'Analyse',
    addName: 'Speichern als …',
    leaveConfirmation: 'Du hast ungespeicherte Änderungen! Möchtest du die Seite wirklich verlassen?'
  },
  filter: {
    attributionFilter: 'Kriterien filtern, um die Attribute (Zellenwerte) auszuwählen',
    baseFilter: 'Kriterien filtern, um die {entityName} (Zeilen) auszuwählen',
    attribute: 'Attribut',
    noFilter: 'Kein Filter definiert. Alle {entity} werden angezeigt. Klicke auf den Plus-Button, um Filterkriterien hinzuzufügen.',
    simplifiable: 'Unnötige Komplexität erkannt.',
    simplify: 'Filter vereinfachen',
    invalid: 'Ungültige Filterregeln. Korrigiere oder lösche sie.',
    valid: 'Glückwunsch, alle Regeln sind gültig.',
    entities: {
      cultivarAndSubentities: 'Cultivar, dessen Gruppen oder Pflanzen',
      groupAndSubentities: 'Gruppe oder dessen Pflanzen'
    },
    explainer: {
      title: 'Erklärung:',
      attributeWithNoAttributions: 'Die/das {entity} hat entweder keine {column} Attributierung oder mindestens eine, die folgende Bedingung erfüllt: {column} {operator} {term}',
      attribute: 'Die/das {entity} hat mindestens eine Attributierung, die folgende Bedingung erfüllt: {column} {operator} {term}',
      entity: 'Die/das {entity} erfüllt: {column} {operator} {term}',
      invalidRule: 'Ungültige Regel. Bitte vervollständige, korrigiere oder lösche sie.'
    },
    error: {
      column: 'Bitte Spalte auswählen.',
      operator: 'Bitte Operator auswählen.',
      term: 'Bitte gültigen Wert eingeben.'
    },
    column: 'Zeile',
    operator: 'Operator',
    term: 'Wert',
    withNoAttributions: 'Inklusive {entities} ohne {attributeName} Attributionen.',
    operators: {
      equals: 'gleich',
      notEquals: 'nicht gleich',
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
      andFilter: 'UND Kriterium',
      orFilter: 'ODER Kriterium',
      and: 'und',
      or: 'oder'
    }
  },
  result: {
    title: 'Ergebnisse',
    aggregations: {
      count: 'Anzahl',
      max: 'Max',
      min: 'Min',
      mean: 'Durchschnitt',
      median: 'Median',
      stdDev: 'Var',
      theCount: 'die Anzahl',
      theMax: 'das Maximum',
      theMin: 'das Minimum',
      theMean: 'der Durchschnitt',
      theMedian: 'der Median',
      theStdDev: 'die Standardabweichung'
    },
    aggTitle: '{value} ist {theAggregation} von:',
    altPhoto: 'Foto vom {date} von {author}',
    photo: 'Foto',
    downloadPhoto: 'Foto herunterladen',
    lastRefresh: 'Letzte Aktualisierung: {date}',
    attributedEntity: 'Attributierte/s {entity}',
    note: 'Bemerkung',
    about: {
      attribution: 'Über diese Attributierung',
      plant: 'Über die Pflanze',
      plantGroup: 'Über die Gruppe',
      cultivar: 'Über das Cultivar',
      lot: 'Über das Los'
    }
  }
};