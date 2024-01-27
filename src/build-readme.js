import RssParser from 'rss-parser'
import remark from 'remark'
import zone from 'mdast-zone'
import { promises } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const rssParser = new RssParser()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const readmePath = join(__dirname, '..', 'README.md')

const feed = await rssParser.parseURL('https://codepunkt.de/writing/rss.xml')
const fileContent = await promises.readFile(readmePath)
const file = await remark()
  .use(refreshBlogPosts(feed.items.slice(0, 3)))
  .process(fileContent)
await promises.writeFile(readmePath, String(file))

function refreshBlogPosts (feedItems) {
  return () => (tree) => {
    zone(tree, 'blog', (start, nodes, end) => {
      return [
        start,
        {
          type: 'list',
          ordered: false,
          children: feedItems.map(
            ({ title, link, contentSnippet, pubDate }) => {
              return {
                type: 'listItem',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'link',
                        url: link.replace(
                          'codepunkt.dewriting',
                          'codepunkt.de/writing'
                        ),
                        children: [{ type: 'text', value: title }],
                      },
                      { type: 'html', value: '<br/>' },
                      {
                        type: 'emphasis',
                        children: [{ type: 'text', value: contentSnippet }],
                      },
                    ],
                  },
                ],
              }
            }
          ),
        },
        end,
      ]
    })
  }
}
