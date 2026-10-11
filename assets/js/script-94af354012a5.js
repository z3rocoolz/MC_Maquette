document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.mm-acc-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var body = btn.nextElementSibling;
      var isOpen = btn.classList.contains('open');
      document.querySelectorAll('.mm-acc-btn').forEach(function(b) {
        b.classList.remove('open');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) { btn.classList.add('open'); body.classList.add('open'); }
    });
  });
});
