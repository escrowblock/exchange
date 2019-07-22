const shareList = {
    facebook: 'http://www.facebook.com/sharer.php?s=100&&p[summary]={{TEMPLATE_TEXT}}&p[url]={{TEMPLATE_URL}}&p[images][0]={{TEMPLATE_IMAGE}}',
    twitter: 'https://twitter.com/share?url={{TEMPLATE_URL}}&text={{TEMPLATE_TEXT}}',
    google_plus: 'https://plus.google.com/share?url={{TEMPLATE_URL}}',
    linkedin: 'https://www.linkedin.com/cws/share?url={{TEMPLATE_URL}}',
    xing: 'https://www.xing.com/social_plugins/share?url={{TEMPLATE_URL}}',
    vk: 'http://vk.com/share.php?url={{TEMPLATE_URL}}&description={{TEMPLATE_TEXT}}&image={{TEMPLATE_IMAGE}}',
    baidu: 'http://cang.baidu.com/do/add?it=&iu={{TEMPLATE_URL}}',
    reddit: 'http://www.reddit.com/submit?url={{TEMPLATE_URL}}&title={{TEMPLATE_TEXT}}',
    weibo: 'http://v.t.sina.com.cn/share/share.php?title={{TEMPLATE_TEXT}}&url={{TEMPLATE_URL}}',
    whatsapp: 'whatsapp://send?text={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}',
    skype: 'skype:?chat&topic={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}',
    telegram: 'tg://msg?text={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}',
    messenger: 'fb-messenger://share?link={{TEMPLATE_URL}}',
    viber: 'viber://forward?text={{TEMPLATE_URL}} {{TEMPLATE_TEXT}}',
    line: 'line://msg/text/?{{TEMPLATE_URL}} {{TEMPLATE_TEXT}}',
};

export { shareList as default };
