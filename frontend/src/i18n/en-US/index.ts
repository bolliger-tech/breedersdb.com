const messages = {
  base: {
    loading: 'Loading...',
    suspenseWithError: {
      reload: 'Reload page',
      title: 'Error',
    },
  },
  layout: {
    nav: {
      trees: {
        main: 'Trees',
        list: 'List',
        new: 'New',
      },
      groups: {
        main: 'Groups',
        list: 'List',
        new: 'New',
      },
      cultivars: { main: 'Cultivars' },
      lots: { main: 'Lots' },
      crossings: { main: 'Crossings' },
      more: { main: 'More' },
    },
  },
};

const datetimeFormats = {
  ymd: {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  },
  Ymd: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
  ymdHis: {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
  YmdHis: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
};

export default { messages, datetimeFormats };
