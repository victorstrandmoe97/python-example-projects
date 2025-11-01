import { BigQuery } from '@google-cloud/bigquery';
import process from 'process';

const bigquery = new BigQuery();
const dataset = 'security_stories';

export async function initializeDatabase() {
  try {
    await bigquery.dataset(dataset).get();
    console.log('✓ BigQuery connection established');
  } catch (error) {
    console.error('Error connecting to BigQuery:', error);
    throw error;
  }
}
export async function searchVulnerabilitiesInDataset(cve) {
  const query = `
      WITH latest_story AS (
        SELECT story_id
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_vulnerabilities\`
        WHERE cve_code = @cve
          AND created_date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        ORDER BY created_date DESC
        LIMIT 1
      )
      SELECT v.cve_code, v.weakness_code, v.weakness_name, v.story_id
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_vulnerabilities\` v
      JOIN latest_story ls
        ON v.story_id = ls.story_id
      WHERE v.cve_code = @cve;
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { cve }
    });

    if (rows.length === 0) return null;

    return rows; // all rows within the last 30 days
  } catch (error) {
    console.error('Error searchVulnerabilities:', error);
    throw error;
  }
}

export async function getEmailReferencesByIds(emailIds) {
  const query = `
    SELECT title, sender, email_id, date_received, created_date
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.email_references\`
    WHERE email_id IN UNNEST(@emailIds)
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { emailIds }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching email references:', error);
    throw error;
  }
}

export async function getAllEmailReferences() {
  const query = `
    SELECT title, sender, email_id, date_received, created_date
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.email_references\`
  `;

  try {
    const [rows] = await bigquery.query({
      query,
    });
    return rows;
  } catch (error) {
    console.error('Error fetching email references:', error);
    throw error;
  }
}


export async function getEmailReferencesForDateRange(startDate, endDate) {
  const query = `
    SELECT title, sender, email_id, date_received, created_date
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.email_references\`
    WHERE DATE(date_received) BETWEEN @startDate AND @endDate
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { startDate, endDate }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching email references:', error);
    throw error;
  }
}


export async function getStoryReferencesForEmail(emailId) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_references\`
    WHERE email_id = @emailId
  `;

  console.log("executing query: ", query);
  try {
    const [rows] = await bigquery.query({
      query,
      params: { emailId }
    });
    return rows;
  } catch (error) {
    const out = {
      code:    error.code || error.error?.code || 'UNKNOWN',
      message: error.message || error.error?.message,
      errors: (error.errors || error.error?.errors || []).map(e => ({
        reason:   e.reason,
        message:  e.message,
        location: e.location,
        domain:   e.domain
      }))
    };
  
    console.error('BigQuery error:\n', JSON.stringify(out, null, 2));
    throw error;
  }
}

export async function insertEmailRef(emailRef) {
  const rows = [{
    email_id: emailRef.email_id,
    date_received: emailRef.date_received,
    title: emailRef.title,
    sender: emailRef.sender,
    created_date: emailRef.created_date ?? new Date(),
    updated_date: new Date()
  }];

  try {
    await bigquery
      .dataset(dataset)
      .table('email_references')
      .insert(rows);
    console.log('✓ Email reference inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting email reference:', error);
    throw error;
  }
}


export async function insertStories(stories, vulnerabilities) {
  const storyReferences = stories.map(story => ({
    story_id: story.story_id,
    email_id: story.email_id,
    date_reported: story.date_reported,
    date_collected: story.date_collected,
    created_date: new Date(),
    updated_date: new Date()
  }));



  const storyLabels = stories.map(story => ({
    story_id: story.story_id,
    headline: story.headline,
    technologies: story.technologies || [],
    industries: story.industries || [],
    affiliated_organizations: story.affiliated_organizations || [],
    cve_codes: story.cve_codes || [],
    attacks: story.attacks  || [],
    timeline_classification: story.timeline_classification,
    types: story.types || [],
    created_date: new Date(),
    updated_date: new Date()
  }));


  try {
    await bigquery
      .dataset(dataset)
      .table('story_references')
      .insert(storyReferences);
    console.log(`✓ ${storyReferences.length} story references inserted`);
  } catch (error) {
    console.error('Error inserting story references:', error);
    throw error;
  }

  try {
    await bigquery
      .dataset(dataset)
      .table('story_labels')
      .insert(storyLabels);
    console.log(`✓ ${storyLabels.length} story labels inserted`);
  } catch (error) {
    console.error('Error inserting story labels:', error);
    if(error.errors.length > 0) {
      console.error('Error details insert story labels:', error.errors.map(err => console.error(err.errors)));
    }
    throw error;
  }

  
  if(vulnerabilities.length > 0) {
    const story_vulnerabilities = vulnerabilities.map(story => ({
      story_vulnerability_id: story.story_vulnerability_id,
      story_id: story.story_id,
      weakness_name: story.weakness_text,
      weakness_code: story.weakness_code,
      owasp_top_ten: story.owasp_top_ten,
      match_type: story.match_type,
      match_text: story.match_text,
      cve_code: story.cve_code,
      created_date: new Date()
    }))
    try {
      await bigquery
        .dataset(dataset)
        .table('story_vulnerabilities')
        .insert(story_vulnerabilities);
      console.log(`✓ ${story_vulnerabilities.length} story vulnerabilities inserted`);
    } catch (error) {
      console.error('Error inserting story vulnerabilities:', error);
      if(error.errors.length > 0) {
        console.error('Error details insert story vulnerabilities:', error.errors.map(err => console.error(err.errors)));
      }
      throw error;
    }
  }
}

export async function getClustersFromTrendTable(startDate, endDate) {
  console.log("startDate: ", startDate);
  console.log("endDate: ", endDate);
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.weekly_trending_stories\`
    WHERE date_start >= @date_start AND date_end <= @date_end
  `;


  try {
    const [rows] = await bigquery.query({
      query,
      params: { date_start: startDate, date_end: endDate }
    });

    return rows;
  } catch (error) {
    console.error('Error fetching story clusters:', error);
    throw error;
  }
}


export async function getStoriesFromCluster(clusterId, dateStart, dateEnd) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.weekly_trending_stories\`
    WHERE cluster_id = @clusterId
      AND date_start <= @dateEnd
      AND date_end >= @dateStart
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { clusterId, dateStart, dateEnd }
    });

    if (rows.length === 0) {
      console.log(`No stories found for cluster ID: ${clusterId}`);
      return [];
    }

    const storyIds = rows.flatMap(row => row.story_refs.map(ref => ref.story_id));
    const labels = await getStoryLabels(storyIds);

    const stories = rows.flatMap(row =>
      row.story_refs.map(ref => {
        const label = labels.find(lbl => lbl.story_id === ref.story_id) || {};
        return {
          story_id: ref.story_id,
          email_id: ref.email_id,
          date_reported: ref.date_reported,
          date_collected: ref.date_collected,
          headline: label.headline || '',
          technologies: label.technologies || [],
          industries: label.industries || [],
          affiliated_organizations: label.affiliated_organizations || [],
        };
      })
    );

    return stories;
  } catch (error) {
    console.error('Error fetching stories from cluster:', error);
    throw error;
  }
}

export async function getStoryLabels(storyIds) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.story_labels\`
    WHERE story_id IN UNNEST(@storyIds)
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { storyIds }
    });
    return rows;
  } catch (error) {
    console.error('Error fetching story labels:', error);
    throw error;
  }
}

export async function getWeeklyOperativesNewsletterSubscribers() {
  const query = `
    SELECT 
      subs.user_id,
      subs.frameworks,
      subs.companies,
      refs.email_address,
      refs.date_created AS user_date_created
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.subscriptions_weekly_operatives_newsletter\` subs
    LEFT JOIN \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.threat_digest_customer_configs\` refs
    ON subs.user_id = refs.user_id
    WHERE subs.active_subscription = true
  `;

  try {
    const [rows] = await bigquery.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching weekly operatives newsletter subscribers:', error);
    throw error;
  }
}


export async function insertWeeklyNewsletterForOperatives(newsletter) 
{
  const rows = [{
    report_id: newsletter.report_id,
    week: newsletter.week,
    year: newsletter.year,
    directives: newsletter.directives,
    trends: newsletter.trends,
    created_date: newsletter.created_date ??  new Date(),
  }];

  try {
    // Query the table to check for existing newsletters for the same week and year
    const query = `
      SELECT report_id
      FROM \`${dataset}.weekly_newsletter_for_operatives\`
      WHERE week = @week AND year = @year
      LIMIT 1
    `;
    const options = {
      query,
      params: {
        week: newsletter.week,
        year: newsletter.year,
      },
    };

    const [job] = await bigquery.createQueryJob(options);
    const [results] = await job.getQueryResults();

    if (results.length > 0) {
      throw new Error(`Newsletter for week ${newsletter.week} of year ${newsletter.year} already exists.`);
    }

    // Proceed to insert if no duplicates are found
    await bigquery
      .dataset(dataset)
      .table('weekly_newsletter_for_operatives')
      .insert(rows);

    console.log('✓ Newsletter successfully inserted into weekly_newsletter_for_operatives');
    return rows[0];
  } catch (error) {
    console.error('Error inserting newsletter into weekly_newsletter_for_operatives:', error);
    throw error;
  }
}

export async function insertWeeklyNewsletter(newsletter, type) {
  if (type === 'operatives') {
    return insertWeeklyNewsletterForOperatives(newsletter);
  } else {
    throw new Error(`Invalid newsletter type: ${type}`);
  }
}

export async function getWeeklyNewsletterForOperatives(week, year) {
  const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.weekly_newsletter_for_operatives\`
    WHERE week = @week AND year = @year
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      params: { week, year }
    });
    return rows[0];
  } catch (error) {
    console.error('Error fetching newsletter for operatives:', error);
    throw error;
  }
}


export async function getWeeklyOperativesNewsletterSubscriber(email) {
  try {
    const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.threat_digest_customer_configs\`
    WHERE email_address = @email
  `;

    const [rows] = await bigquery.query({
      query,
      params: { email }
    });

    const user = rows[0];
    if (!user || !user.user_id) {
      console.log('No user found with email:', email);
      return null;
    }

    const [subscriber] = await bigquery
      .dataset("sales")
      .table('subscriptions_weekly_operatives_newsletter')
      .query({
        query: `
          SELECT *
          FROM \`sales.subscriptions_weekly_operatives_newsletter\`
          WHERE user_id = @user_id AND active_subscription = true
        `,
        params: { user_id: user.user_id }
      });

      if(!subscriber || !subscriber[0]) {
        console.log('No subscriber found with user_id:', user.user_id);
        return null;
      }

      return {
        ...subscriber[0],
        ...user
      };

  }catch (error) {
    console.error('Error fetching weekly operatives newsletter subscriber:', error);
    throw error;
  }
}

export async function getThreatDigestSubscription(email) {
  try {
    const query = `
    SELECT *
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.sales.threat_digest_customer_configs\`
    WHERE email_address = @email
  `;

    const [rows] = await bigquery.query({
      query,
      params: { email }
    });

    const sub = rows[0];
    if (!sub) {
      console.log('No  sub with email:', email);
      return false;
    }

    if(vuln.product_id) {
      return true
    }

  }catch (error) {
    console.error('Error getThreatDigestSubscription: ', error);
    throw error;
  }
}

export async function insertNewThreatDigestSubscription(customeRef) {
  const rows = [{
    customer_id: customeRef.customer_id,
    product_id: customeRef.product_id,
    email_address: customeRef.email_address,
    include_government: customeRef.include_government,
    include_regulatory: customeRef.include_regulatory,
    topics_of_interest: customeRef.topics_of_interest,
    date_created: new Date()
  }];

  try {
    await bigquery
      .dataset("sales")
      .table('threat_digest_customer_configs')
      .insert(rows);
    console.log('✓ Email reference inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting email reference:', error);
    throw error;
  }
}


export async function insertWeeklyOperativesNewsletterSubscriber(subscriber) {
  try {
    const existingSubscriber = await getWeeklyOperativesNewsletterSubscriber(subscriber.email_address);
    
    if (existingSubscriber) {
      console.log(`Subscriber with email ${subscriber.email_address} already exists in operatives newsletter.`);
      return;
    }

    console.log(`Inserting weekly operatives newsletter subscriber:`, subscriber);

    const rows = [{
      subscription_id: subscriber.subscription_id,
      user_id: subscriber.user_id,
      frameworks: subscriber.frameworks,
      platforms: subscriber.platforms,
      companies: subscriber.companies,
      date_created: subscriber.date_created,
      date_updated: subscriber.date_updated,
      paying_subscription: subscriber.paying_subscription,
      active_subscription: subscriber.active_subscription,
    }];

    await bigquery
      .dataset("sales")
      .table('subscriptions_weekly_operatives_newsletter')
      .insert(rows);
    console.log('✓ Weekly operatives newsletter subscriber inserted');
    return rows[0];
  } catch (error) {
    console.error('Error inserting weekly operatives newsletter subscriber:', error);
    error.errors.map((error) => {
      console.error(`  Details: ${JSON.stringify(error, null, 2)}`);
    });
    throw error;
  }
}

export async function getRecentCweForCveInRegistry(weakness_code) {
  try {
    const query = `
    SELECT weakness_code
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.weakness_thirty_day_general_report\`
    WHERE weakness_code = @weakness_code AND DATE(created_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  `;

    const [rows] = await bigquery.query({
      query,
      params: { weakness_code }
    });

    const vuln = rows[0];
    if (!vuln) {
      console.log('No  vuln with weakness_code:', weakness_code);
      return false;
    }

    if(vuln.weakness_code) {
      return true
    }

  }catch (error) {
    console.error('Error hasRecentCweForCveInRegistry: ', error);
    throw error;
  }
}


export async function writeBufferedSubscriptionDataToBigQuery(rows, tableId) {
  const query = `
    MERGE INTO \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.${tableId}\` AS target
    USING UNNEST(@rows) AS source
    ON target.user_id = source.user_id
    WHEN MATCHED THEN
      UPDATE SET
        target.active_subscription = source.active_subscription,
        target.paying_subscription = source.paying_subscription,
        target.date_updated = source.date_updated
    WHEN NOT MATCHED THEN
      INSERT (paying_subscription, active_subscription)
      VALUES (source.paying_subscription, source.active_subscription);
  `;

  const options = {
    query: query,
    params: { rows },
  };

  try {
    const [job] = await bigquery.createQueryJob(options); 
    await job.promise();
    console.log('Upserted rows into BigQuery successfully.');
  } catch (error) {
    console.error('Error upserting rows into BigQuery:', error);
  }
}
