/* Small dependency-free enhancements for the personal portfolio. */
document.addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('.theme-toggle');
  if(button) button.addEventListener('click',()=>{
    const pressed=document.body.classList.toggle('dark-mode');
    button.setAttribute('aria-pressed',String(pressed));
  });
  const collapsible=document.querySelector('#navbarNav');
  document.querySelectorAll('.navbar .nav-link[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
    if(!collapsible?.classList.contains('show'))return;
    if(window.bootstrap?.Collapse)window.bootstrap.Collapse.getOrCreateInstance(collapsible,{toggle:false}).hide();
    else collapsible.classList.remove('show');
  }));
});
