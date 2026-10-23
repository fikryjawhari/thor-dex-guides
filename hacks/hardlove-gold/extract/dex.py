"""Parse the Hardlove docs site's pokedex pages (one per species/form) into dicts."""
import os,re,html
SEC=['Evolves From','Evolves To','Other Forms','Level-Up Moves','Machine Moves','Tutor Moves','Egg Moves','Wild Locations']
def parse(path):
    t=open(path,encoding='utf-8').read();f=os.path.basename(path)
    o={'f':f,'n':html.unescape(re.search(r"<h2 class='center'>(.*?)<\/h2>",t).group(1)).strip()}
    o['t']=[html.unescape(x) for x in re.findall(r"<span class='type [^']*'>([^<]+)<\/span>",t)]
    ab=t.split('<strong>Abilities:</strong>',1)[1].split('<h3',1)[0]
    o['a']=[html.unescape(x).strip() for x in re.findall(r'>([^<>]+)<\/a>',ab)]
    o['s']=[int(x) for x in re.findall(r'<div class="bar-fill"[^>]*>(\d+)<\/div>',t)]
    parts=re.split(r"<h3 class='center'>([^<]+)<\/h3>",t);sec={}
    for i in range(1,len(parts),2):
        name,body=parts[i],parts[i+1]
        if name not in SEC:continue
        if '<table' in body:
            rows=[[html.unescape(re.sub('<[^>]+>','',c)).strip() for c in re.findall(r'<td>(.*?)<\/td>',r)] for r in re.findall(r'<tr>(.*?)<\/tr>',body.split('</table>')[0],re.S)]
            rows=[r for r in rows if r and r!=['(none)']]
            sec[name]=[r if len(r)>1 else r[0] for r in rows]
        else:
            lis=re.findall(r'<li>(.*?)<\/li>',body.split('</ul>')[0],re.S);L=[]
            for li in lis:
                m=re.search(r"href='([^']+)'",li)
                L.append({'x':html.unescape(re.sub('<[^>]+>','',li)).strip(),'l':m.group(1) if m else None})
            sec[name]=L
    o['sec']=sec;return o
def load(d):
    return [parse(os.path.join(d,f)) for f in sorted(os.listdir(d)) if f.endswith('.html') and f!='index.html']
