const { chromium }=require('playwright');
const fs=require('fs');
const path=require('path');
const assert=require('assert').strict;
const root=path.resolve(__dirname,'..');
const output=path.join(root,'showcase-shots');
fs.mkdirSync(output,{recursive:true});
const url=(name)=>'file://'+path.join(root,name);
async function checkNoOverflow(page,label){
  const v=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(v.width<=v.viewport+3,label+' horizontal overflow: '+JSON.stringify(v));
}
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try{
    const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];
    desktop.on('pageerror',e=>errors.push(e.message));
    await desktop.goto(url('index.html'),{waitUntil:'domcontentloaded'});
    await desktop.locator('.project-gallery .study-card').first().waitFor();
    assert.equal(await desktop.locator('.project-gallery .study-card').count(),5);
    assert.equal(await desktop.locator('.featured-project').count(),2,'real personal projects should be featured');
    assert.equal(await desktop.locator('.skills-list li').count(),6,'skill tags should replace arbitrary percentage bars');
    assert.equal(await desktop.locator('main').count(),1,'page needs one main landmark');
    assert.ok(await desktop.locator('.portfolio-disclosure').isVisible(),'sample content must be disclosed');
    const sourceHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
    const referencedImages=[...sourceHtml.matchAll(/<img\\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(referencedImages.length>=6,'portrait and gallery images must remain');
    for(const imagePath of referencedImages) assert.ok(fs.existsSync(path.join(root,imagePath)), 'Missing image asset: '+imagePath);
    await desktop.locator('.about-image img').evaluate(img=>img.decode());
    const pageStructure=await desktop.evaluate(()=>{
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const anchors=[...document.querySelectorAll('a[href^="#"]')].map(e=>e.getAttribute('href').substring(1));
      return {duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),brokenAnchors:anchors.filter(id=>id&&!ids.includes(id)) };
    });
    assert.deepEqual(pageStructure.duplicateIds,[],'duplicate element ids');
    assert.deepEqual(pageStructure.brokenAnchors,[],'broken internal anchor links');
    assert.equal(await desktop.locator('form').count(),0,'unsent static contact form must not remain');
    assert.ok(await desktop.locator('a[href^="mailto:"]').count()>=1);
    await checkNoOverflow(desktop,'original desktop');
    const themeToggle=desktop.locator('.theme-toggle');
    await themeToggle.click();
    assert.equal(await desktop.locator('body.dark-mode').count(),1,'dark theme toggle did not apply');
    assert.equal(await themeToggle.getAttribute('aria-pressed'),'true');
    await desktop.reload({waitUntil:'domcontentloaded'});
    assert.equal(await desktop.locator('body.dark-mode').count(),1,'theme preference not retained on reload');
    await desktop.locator('.theme-toggle').click();
    assert.equal(await desktop.locator('body.dark-mode').count(),0,'light theme toggle did not apply');
    await desktop.goto(url('upwork-showcase.html'),{waitUntil:'load'});
    await desktop.locator('.desktop').waitFor();
    const html=fs.readFileSync(path.join(root,'upwork-showcase.html'),'utf8');
    assert.doesNotMatch(html,/mailto:|instagram\.com|linkedin\.com|@gmail|@outlook|sukhjindra|sukhjindrasingh|href="https?:\/\//i,'Upwork-safe page must have no personal contact details or external links');
    assert.equal(await desktop.locator('a[href^="http"]').count(),0);
    await desktop.locator('button[data-tab="home"]').click();
    await desktop.screenshot({path:path.join(output,'01-upwork-cover.png'),animations:'disabled'});
    await desktop.locator('.browser').screenshot({path:path.join(output,'02-homepage-layout.png'),animations:'disabled'});
    for(const [tab,file] of [['gallery','03-project-gallery.png'],['resume','04-resume-layout.png']]){
      await desktop.locator('button[data-tab="'+tab+'"]').click();
      assert.ok(await desktop.locator('[data-screen="'+tab+'"]').isVisible());
      await desktop.locator('.browser').screenshot({path:path.join(output,file),animations:'disabled'});
    }
    await checkNoOverflow(desktop,'Upwork desktop');
    const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(url('upwork-showcase.html'),{waitUntil:'load'});
    await checkNoOverflow(mobile,'Upwork mobile');
    await mobile.locator('button[data-tab="mobile"]').click();
    assert.ok(await mobile.locator('[data-screen="mobile"]').isVisible());
    await mobile.locator('.phone').screenshot({path:path.join(output,'05-mobile-layout.png'),animations:'disabled'});
    await mobile.goto(url('index.html'),{waitUntil:'domcontentloaded'});
    assert.equal(await mobile.locator('.featured-project').count(),2);
    assert.ok(await mobile.locator('.skip-link').count()===1);
    assert.ok(await mobile.locator('.navbar-toggler-icon').isVisible());
    await checkNoOverflow(mobile,'original mobile');
    const toggle=mobile.locator('.navbar-toggler');
    assert.ok(await toggle.isVisible(),'Original site should show mobile navbar toggle');
    await toggle.click();
    await mobile.waitForTimeout(450);
    assert.ok(await mobile.locator('#navbarNav').isVisible(),'Bootstrap mobile navbar failed to open');
    await mobile.locator('#navbarNav a[href="#resume"]').click();
    await mobile.waitForTimeout(450);
    assert.ok(!(await mobile.locator('#navbarNav').isVisible()),'Mobile navbar should close after selection');
    assert.deepEqual(errors,[],'Unexpected page JavaScript errors');
    console.log('PASS: project cards, semantic structure, truthful sample disclaimer, loaded images, six skills, valid anchors, dark-theme persistence, mobile navigation, Upwork-safe tabs, no horizontal overflow, and five screenshot exports');
  } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
