const windowParameters = "width=640, height=480"

function facebookShare() {
  const link = "https://www.facebook.com/sharer/sharer.php?u=https://thema.chat";
  const win = window.open(link, 'Thema', windowParameters);
  win.focus();
}

function twitterShare() {
  const link = "https://twitter.com/home?status=Check%20out%20this%20website%20https%3A//thema.chat%20and%20talk%20with%20someone%20interested%20in%20the%20same%20topic%20as%20you!"
  const win = window.open(link, '_blank', windowParameters);
  win.focus();
}

